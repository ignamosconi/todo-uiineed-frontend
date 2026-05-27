// vue/methods.js
import { api }        from "../api/todos.api.js";
import { state }      from "../core/state.js";
import { createFlow } from "../core/init.js";
import { showLoader, hideLoader } from "../core/init.js";
import { config } from "../config/config.js";


// Helper: genera un id temporal negativo para todos optimistas
let _tempId = -1;
function tempId() { return _tempId--; }

export const methods = {

    //REFRESH (solo para bulk ops y rollback)
    async refreshTodos() {
        try {
            const [todosRes, trashRes] = await Promise.all([
                api.getTodos(state.listUrl),
                api.getTrash(state.listUrl)
            ]);

            if (!todosRes.ok || !trashRes.ok) return;

            const todosData = await todosRes.json();
            const trashData = await trashRes.json();

            this.todos = [
                ...todosData.map(t => ({ id: t.id, title: t.name, completed: t.status === "completed", removed: false })),
                ...trashData.map(t => ({ id: t.id, title: t.name, completed: t.status === "completed", removed: true })),
            ];
        } catch(e) {
            console.error(e);
        }
    },

    //Añadir un TODO (optimista)
    async addTodo() {
        if (this.newTodoTitle === '') {
            this.checkEmpty = true;
            return;
        }

        const name  = this.newTodoTitle;
        const fakeId = tempId();

        // 1. UI inmediato
        this.todos.push({ id: fakeId, title: name, completed: false, removed: false });
        this.newTodoTitle = '';
        this.checkEmpty = false;

        // 2. Backend en background
        try {
            const res = await api.addTodo(state.listUrl, name);

            if (!res.ok) {
                // Revertir: sacar el todo falso
                this.todos = this.todos.filter(t => t.id !== fakeId);
                let message = "Error creating todo.";
                try { const d = await res.json(); if (d.message) message = d.message; } catch {}
                alert(message);
                return;
            }

            //sincronizar estado después de confirmar el ID:
            const created = await res.json();
            const idx = this.todos.findIndex(t => t.id === fakeId);
            if (idx !== -1) {
                this.todos[idx].id = created.id;

                // Si el usuario cambió el status mientras era temporal, sincronizamos ahora
                if (this.todos[idx].completed) {
                    api.updateStatus(state.listUrl, created.id, "completed").catch(console.error);
                }

                // Si el usuario lo mandó a trash mientras era temporal, sincronizamos ahora
                if (this.todos[idx].removed) {
                    api.updateIsEliminated(state.listUrl, created.id, true).catch(console.error);
                }
            }

        } catch(e) {
            console.error(e);
            this.todos = this.todos.filter(t => t.id !== fakeId);
            alert("Can't connect to server :(");
        }
    },

    //TOGGLE STATUS para los todos, con debaunce (evitar spam)
    //Ambas acciones (complete / uncomplete) pasan por el mismo debounce.
    _scheduleStatusUpdate(todo, newStatus) {
        const id = todo.id;
        todo.completed = (newStatus === "completed");
        this.pendingStatus[id] = newStatus;

        if (this.pendingTimers[id]) clearTimeout(this.pendingTimers[id]);

        // Si el ID es temporal, solo actualizamos el UI. El addTodo se encargará
        // de sincronizar el estado final cuando el back confirme.
        if (id < 0) return;

        this.pendingTimers[id] = setTimeout(async () => {
            delete this.pendingTimers[id];
            const statusToSend = this.pendingStatus[id];
            delete this.pendingStatus[id];
            try {
                const res = await api.updateStatus(state.listUrl, id, statusToSend);
                if (!res.ok) await this.refreshTodos();
            } catch(e) {
                console.error(e);
                await this.refreshTodos();
            }
        }, config.DEBOUNCE_MS);
    },

    async markAsCompleted(todo) {
        this._scheduleStatusUpdate(todo, "completed");
    },

    async markAsUncompleted(todo) {
        this._scheduleStatusUpdate(todo, "created");
    },

    //EDIT NAME (optimista — Vue ya bindea directo con v-model)
    async editDone(todo) {
        if (todo.title.trim() === '') {
            this.cancelEdit(todo);
            return;
        }

        this.editedTodo = null; // cierra UI inmediato

        try {
            const res = await api.updateName(state.listUrl, todo.id, todo.title);
            if (!res.ok) {
                alert("Error updating todo name.");
                await this.refreshTodos();
            }
        } catch(e) {
            console.error(e);
            alert("Can't connect to server :(");
            await this.refreshTodos();
        }
    },

    //REMOVE / RESTORE, ambos optimistas.
    async removeTodo(todo) {
        todo.removed = true;

        if (todo.id < 0) return; //el addTodo lo sincroniza cuando confirme

        try {
            const res = await api.updateIsEliminated(state.listUrl, todo.id, true);
            if (!res.ok) {
                todo.removed = false;
                alert("Error sending todo to trash.");
            }
        } catch(e) {
            console.error(e);
            todo.removed = false;
            alert("Can't connect to server :(");
        }
    },

    async restoreTodo(todo) {
        todo.removed = false; // UI inmediato

        try {
            const res = await api.updateIsEliminated(state.listUrl, todo.id, false);
            if (!res.ok) {
                todo.removed = true;
                alert("Error restoring todo from trash.");
            }
        } catch(e) {
            console.error(e);
            todo.removed = true;
            alert("Can't connect to server :(");
        }
    },

    //Operaciones masivas (son optimistas porque actualizan todo el array local)
    async markAllAsCompleted() {
        const confirmed = await confirm('Mark all todos as completed?');
        if (!confirmed) return;

        // Snapshot para rollback
        const snapshot = this.todos.map(t => ({ ...t }));

        // UI inmediato
        this.todos.forEach(t => { if (!t.removed) t.completed = true; });

        try {
            const res = await api.completeAll(state.listUrl);
            if (!res.ok) {
                this.todos = snapshot;
                alert("Error updating todos to completed.");
            }
        } catch(e) {
            console.error(e);
            this.todos = snapshot;
            alert("Can't connect to server :(");
        }
    },

    async clearCompleted() {
        const confirmed = await confirm('Send all completed todos to trash?');
        if (!confirmed) return;

        const snapshot = this.todos.map(t => ({ ...t }));
        this.todos.forEach(t => { if (t.completed && !t.removed) t.removed = true; });

        try {
            const res = await api.clearCompleted(state.listUrl);
            if (!res.ok) {
                this.todos = snapshot;
                alert("Error sending completed todos to trash.");
            }
        } catch(e) {
            console.error(e);
            this.todos = snapshot;
            alert("Can't connect to server :(");
        }
    },

    async clearAll() {
        const confirmed = await confirm('Send all todo items to trash?');
        if (!confirmed) return;

        const snapshot = this.todos.map(t => ({ ...t }));
        this.todos.forEach(t => { if (!t.removed) t.removed = true; });

        try {
            const res = await api.clearAll(state.listUrl);
            if (!res.ok) {
                this.todos = snapshot;
                alert("Error sending all todos to trash.");
            }
        } catch(e) {
            console.error(e);
            this.todos = snapshot;
            alert("Can't connect to server :(");
        }
    },

    async restoreAllTrash() {
        const confirmed = await confirm('Restore all todo items from trash?');
        if (!confirmed) return;

        const snapshot = this.todos.map(t => ({ ...t }));
        this.todos.forEach(t => { if (t.removed) t.removed = false; });

        try {
            const res = await api.restoreTrash(state.listUrl);
            if (!res.ok) {
                this.todos = snapshot;
                alert("Error restoring all todos in trash.");
            }
        } catch(e) {
            console.error(e);
            this.todos = snapshot;
            alert("Can't connect to server :(");
        }
    },

    async clearTrash() {
        const confirmed = await confirm('Delete all todos in trash? This action cannot be undone.');
        if (!confirmed) return;

        const snapshot = this.todos.map(t => ({ ...t }));
        this.todos = this.todos.filter(t => !t.removed);

        try {
            const res = await api.clearTrash(state.listUrl);
            if (!res.ok) {
                this.todos = snapshot;
                alert("Error deleting all todos in trash.");
            }
        } catch(e) {
            console.error(e);
            this.todos = snapshot;
            alert("Can't connect to server :(");
        }
    },

    //NEW LIST (usamos un loader para esperar al backend en esta primera vez de una nueva lista)
    async createNewList() {
        showLoader("Creating new list...");
        this.show = false; // oculta la app mientras carga
        this.isLoading = true;
        this.isCreatingList = true;
        this.newTodoTitle = ''; //limpia el input
        this.checkEmpty = false;

        try {
            const result = await createFlow();
            if (!result) return;

            this.todos = [
                ...result.todos.map(t => ({ id: t.id, title: t.name, completed: t.status === "completed", removed: false })),
                ...(result.trash || []).map(t => ({ id: t.id, title: t.name, completed: t.status === "completed", removed: true })),
            ];
            this.slogan = result.title || "Edit this title or the TODOs names with double-click :)";
            this.intention = 'all';
            this.show = true;
            this.isLoading = false;
        } catch(e) {
            console.error(e);
            this.show = true;
            this.isLoading = false;
        } finally {
            hideLoader();
            this.isCreatingList = false;
        }
    },

    //TITLE (optimista)
    editText() {
        this.originalSlogan = this.slogan;
        this.isEditing = true;
        this.$nextTick(() => { this.$refs.sloganInput.focus(); });
    },

    async saveText() {
        this.isEditing = false; // cierra UI inmediato

        try {
            const res = await api.updateTitle(state.listUrl, this.slogan);
            if (!res.ok) {
                this.slogan = this.originalSlogan;
                alert("Error saving list-title.");
            }
        } catch(e) {
            console.error(e);
            this.slogan = this.originalSlogan;
            alert("Can't connect to server :(");
        }
    },

    cancelText() {
        this.slogan = this.originalSlogan;
        this.isEditing = false;
    },

    getSlogan() {
        return "Edit this title or the TODOs names with double-click :)";
    },

    /*
        LEGACY CODE: 
        UI, drag, etc.
    */
    controlScreen() {
        if (this.windowWidth < 768) {
            this.isShow = !this.isShow;
            return this.shortCut = '≡';
        }
    },
    togglePop() { this.popShow = !this.popShow; },
    shortCutAction() {
        this.isShow = !this.isShow;
        this.shortCut = this.isShow ? '≡' : '≡ Quicks';
    },
    shuffle() { this.filteredTodos = _.shuffle(this.filteredTodos); },

    startEditingTodo(todo) {
        this.editedTodo = { id: todo.id, title: todo.title };
    },
    cancelEdit(todo) {
        todo.title = this.editedTodo.title;
        this.editedTodo = null;
    },

    dragenter(e, index) {
        e.preventDefault();
        if (this.dragIndex === index) return;

        const sourceTodo  = this.filteredTodos[this.dragIndex];
        const targetTodo  = this.filteredTodos[index];
        const sourceIndex = this.todos.findIndex(t => t.id === sourceTodo.id);
        const targetIndex = this.todos.findIndex(t => t.id === targetTodo.id);
        const [moved] = this.todos.splice(sourceIndex, 1);
        this.todos.splice(targetIndex, 0, moved);
        this.dragIndex = index;
    },
    dragstart(event, index) {
        if (window.getSelection().toString().length > 0) { event.preventDefault(); return; }
        this.dragIndex = index;
        this.draggedTodoId = this.filteredTodos[index].id;
    },

    async dragend() {
        const list     = this.filteredTodos;
        const index    = list.findIndex(t => t.id === this.draggedTodoId);
        const beforeId = list[index - 1]?.id;
        const afterId  = list[index + 1]?.id;
        const id       = this.draggedTodoId;

        this.dragIndex     = null;
        this.draggedTodoId = null;

        // Si algún ID involucrado es temporal (todavía no confirmado por el back),
        // el UI ya refleja el orden correcto — esperamos a que el back confirme
        // y el próximo reorder usará IDs reales.
        if (id < 0 || (beforeId !== undefined && beforeId < 0) || (afterId !== undefined && afterId < 0)) {
            return;
        }

        this.reorderQueue.push({ id, beforeId, afterId });
        if (this.isReordering) return;
        await this._processReorderQueue();
    },

    async _processReorderQueue() {
        if (this.isReordering || this.reorderQueue.length === 0) return;
        this.isReordering = true;

        while (this.reorderQueue.length > 0) {
            // Tomamos solo el ÚLTIMO estado deseado por id
            // (si el usuario reordenó el mismo todo dos veces, solo importa el último)
            const last = this.reorderQueue.pop();
            this.reorderQueue = this.reorderQueue.filter(op => op.id !== last.id);

            try {
                const res = await api.reorder(state.listUrl, last.id, last.beforeId, last.afterId);
                if (!res.ok) throw new Error();
            } catch(e) {
                alert("Error reordering. Syncing...");
                await this.refreshTodos();
                break; // si falló, sincronizamos y paramos — el estado visual ya es correcto
            }
        }

        this.isReordering = false;
    },

    dragover(e) { e.preventDefault(); },

    beforeEnter(dom) { dom.classList.add('drag-enter-active'); },
    enter(dom, done) {
        setTimeout(() => {
            this.delayTime = '1';
            dom.classList.remove('drag-enter-active');
            dom.classList.add('drag-enter-to');
            const evt = window.ontransitionend ? "transitionend" : "webkitTransitionEnd";
            dom.addEventListener(evt, function onEnd() {
                dom.removeEventListener(evt, onEnd);
                done();
            });
        }, dom.dataset.delay);
    },
    afterEnter(dom) { dom.classList.remove('drag-enter-to'); },
};