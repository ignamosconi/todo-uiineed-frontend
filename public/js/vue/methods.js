//vue/methods.js
import { api } from "../api/todos.api.js";
import { state } from "../core/state.js";
import { createFlow } from "../core/init.js";

export const methods = {
    //Botón "New list"
    async createNewList() {
        const result = await createFlow();

        if (!result) return;

        // Mapear todos
        this.todos = result.todos.map(t => ({
            id: t.id,
            title: t.name,
            completed: t.status === "completed",
            removed: t.isEliminated
        }));

        // Resetear título
        this.slogan = result.title || "Edit list title or the TODOs names with double-click :)";
    },
    
    //Mapping entre frontend {id, title, completed, removed} y backend {id, name, status, isEliminated}
    //Llamamos a GET /todos/:url para obtener los status=created y status=completed con is-eliminated=false; y hacemos 
    //un GET/todos/:url/trash para obtener los is-eliminated=true
    async refreshTodos() {
        const [todosRes, trashRes] = await Promise.all([
            api.getTodos(state.listUrl),
            api.getTrash(state.listUrl)
        ]);

        if (!todosRes.ok || !trashRes.ok) {
            alert("Error loading todos.");
            return;
        }

        const todosData = await todosRes.json();
        const trashData = await trashRes.json();

        const mappedTodos = todosData.map(t => ({
            id: t.id,
            title: t.name,
            completed: t.status === "completed",
            removed: false
        }));

        const mappedTrash = trashData.map(t => ({
            id: t.id,
            title: t.name,
            completed: t.status === "completed",
            removed: true
        }));

        this.todos = [...mappedTodos, ...mappedTrash];
    },

    /*
        API CALLS
        Métodos que sincronizan las acciones del front con los datos del back.
    */
    //Añadir un nuevo todo
    async addTodo() {
        if (this.newTodoTitle === '') {
            this.checkEmpty = true;
            return;
        }

        const res = await api.addTodo(state.listUrl, this.newTodoTitle);

        if (!res.ok) {
            alert("Error creating todo.");
            return;
        }

        this.newTodoTitle = '';
        this.checkEmpty = false;

        await this.refreshTodos();
    },

    //Pasar un único todo de status created → completed
    async markAsCompleted(todo) {
        const res = await api.updateStatus(state.listUrl, todo.id, "completed");

        if (!res.ok) {
            alert("Error updating todo status.");
            return;
        }

        await this.refreshTodos();
    },

    //Pasar un único todo de status completed → created.
    async markAsUncompleted(todo) {
        const res = await api.updateStatus(state.listUrl, todo.id, "created");

        if (!res.ok) {
            alert("Error updating todo status.");
            return;
        }

        await this.refreshTodos();
    },

    //Cambiar nombre de un único todo. Para poder usar esta función, hay que hacerle doble click a un todo. La función startEditingTodo abre el menú
    //de cambio de nombre cuando se le hace doble click.
    async editDone(todo) {
        if (todo.title === '') {
            await this.removeTodo(todo);
            return;
        }

        const res = await api.updateName(state.listUrl, todo.id, todo.title);

        if (!res.ok) {
            alert("Error updating todo name.");
            return;
        }

        this.editedTodo = null;
        await this.refreshTodos();
    },

    //Pasar un único todo de isEliminated: false → isEliminated: true
    async removeTodo(todo) {
        const res = await api.updateIsEliminated(state.listUrl, todo.id, true);

        if (!res.ok) {
            alert("Error sending todo to trash.");
            return;
        }

        await this.refreshTodos();
    },

    //Pasar un único todo de isEliminated: true → isEliminated: false
    async restoreTodo(todo) {
        const res = await api.updateIsEliminated(state.listUrl, todo.id, false);

        if (!res.ok) {
            alert("Error restoring todo from trash.");
            return;
        }

        await this.refreshTodos();
    },

    //Pasar todos los todos.status = created → todos.status = completed.
    async markAllAsCompleted() {
        const confirmed = await confirm('Mark all todos as completed?');
        if (!confirmed) return;

        const res = await api.completeAll(state.listUrl);

        if (!res.ok) {
            alert("Error updating todos to completed.");
            return;
        }

        await this.refreshTodos();
    },

    //Pasar a todos los 'todos'.status = completed de isEliminated: false → isEliminated: true
    async clearCompleted() {
        const confirmed = await confirm('Send all completed todos to trash?')
        if (!confirmed) return;

        const res = await api.clearCompleted(state.listUrl);

        if (!res.ok) {
            alert("Error sending completed todos to trash.");
            return;
        }

        await this.refreshTodos();
    },

    //Send all to trash
    async clearAll() {
        const confirmed = await confirm('Send all todo items to trash?')
        if (!confirmed) return;
        const res = await api.clearAll(state.listUrl);

        if (!res.ok) {
            alert("Error sending all todos to trash.");
            return;
        }

        await this.refreshTodos();        
    },

    //Restore all from trash
    async restoreAllTrash() {
        const confirmed = await confirm('Restore all todo items from trash?')
        if (!confirmed) return;

        const res = await api.restoreTrash(state.listUrl);

        if (!res.ok) {
            alert("Error restoring all todos in trash.");
            return;
        }

        await this.refreshTodos();
    },

    //Delete all trash items permanently
    async clearTrash() {
        const confirmed = await confirm('Delete all todos in trash? This action cannot be undone.')
        if (!confirmed) return;

        const res = await api.clearTrash(state.listUrl);

        if (!res.ok) {
            alert("Error deleting all todos in trash.");
            return;
        }

        await this.refreshTodos();
    },



    /*
        LEGACY FUNCTIONS - SLOGAN
    */
    //Funciones usadas para slogan, que sería el título de la list en la versión actual.
    editText() {
        this.originalSlogan = this.slogan;
        this.isEditing = true;
        this.$nextTick(() => {
            this.$refs.sloganInput.focus();
        });
    },
    async saveText() {
        const res = await api.updateTitle(state.listUrl, this.slogan);

        if (!res.ok) {
            alert("Error saving list-title.");
        }

        this.isEditing = false;
    },
    cancelText() {
        this.slogan = this.originalSlogan;
        this.isEditing = false;
    },
    getSlogan() {
        return "Edit this title or the TODOs names with double-click :)";
    },

    /*
        LEGACY FUNCTIONS 
        Control de pantalla
    */
    controlScreen: function() {
        if (this.windowWidth < 768) {
            this.isShow = !this.isShow;
            return this.shortCut = 'Filter';
        }
    },
    togglePop: function() {
        this.popShow = !this.popShow;
    },
    shortCutAction: function() {
        this.isShow = !this.isShow;
        if (this.isShow) {
            return this.shortCut = '≡';
        } else {
            return this.shortCut = '≡ Quicks';
        }
    },
    shuffle: function() {
        this.filteredTodos = _.shuffle(this.filteredTodos);
    },

    /*
        LEGACY FUNCTIONS - 
        Abrir menú para editar todo haciendo doble click en él.
        Mover todos por la pantalla.
    */
    // Activa el modo edición para un todo (triggered by double-click) 
    startEditingTodo: function(todo) {
        this.editedTodo = {
            id: todo.id,
            title: todo.title
        }
    },

    cancelEdit: function(todo) {
        todo.title = this.editedTodo.title;
        this.editedTodo = null;
    },

    dragenter(e, index) {
        e.preventDefault();

        if (this.dragIndex !== index) {
            const sourceTodo = this.filteredTodos[this.dragIndex];
            const targetTodo = this.filteredTodos[index];

            const sourceIndex = this.todos.findIndex(t => t.id === sourceTodo.id);
            const targetIndex = this.todos.findIndex(t => t.id === targetTodo.id);

            const [moved] = this.todos.splice(sourceIndex, 1);
            this.todos.splice(targetIndex, 0, moved);

            this.dragIndex = index;
        }
    },

    dragstart(event, index) {
        const selection = window.getSelection().toString();

        if (selection.length > 0) {
            event.preventDefault();
            return;
        }

        this.dragIndex = index;
        this.draggedTodoId = this.filteredTodos[index].id;
    },

    async dragend() {
        const list = this.filteredTodos;

        const index = list.findIndex(t => t.id === this.draggedTodoId);

        const beforeId = list[index - 1]?.id;
        const afterId = list[index + 1]?.id;

        try {
            const res = await api.reorder(
            state.listUrl,
            this.draggedTodoId,
            beforeId,
            afterId
            );

            if (!res.ok) throw new Error();

        } catch (e) {
            alert("Error reordering. Syncing...");
            await this.refreshTodos(); // rollback
        }

        this.dragIndex = null;
        this.draggedTodoId = null;
    },

    dragover: function(e, index) {
        e.preventDefault();
    },
    
    // JS hooks for animation
    beforeEnter(dom) {
        dom.classList.add('drag-enter-active');
    },
    enter(dom, done) {
        let delay = dom.dataset.delay;
        setTimeout(() => {
            this.delayTime = '1';
            dom.classList.remove('drag-enter-active');
            dom.classList.add('drag-enter-to');
            let transitionend = window.ontransitionend
                ? "transitionend"
                : "webkitTransitionEnd";
            dom.addEventListener(transitionend, function onEnd() {
                dom.removeEventListener(transitionend, onEnd);
                done();
                // Call done() to tell Vue animation is complete, triggering afterEnter hook
            })
        }, delay);
    },
    afterEnter(dom) {
        dom.classList.remove('drag-enter-to');
    },
},