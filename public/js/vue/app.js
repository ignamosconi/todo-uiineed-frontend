//vue/app.js
import { computed } from "./computed.js";
import { methods } from "./methods.js";
import { directives } from "./directives.js"
import { watch } from "./watch.js"
import { hideLoader, showLoader } from "../core/init.js";

/*
### VUE ###
Inicialización de una instancia de VUE, que define los "watch" y los "methods" que se usan en la app.
*/
export function createApp(initialData) {
    return new Vue({
        el: '#todo-app',

        data: function() {
            return {
                todos: [],
                isLoading: true,        //Evita que se flasheen los tips antes que carguen los todos del back.
                checkEmpty: false,
                newTodoTitle: '',
                initialData,        //Usamos el que viene del main.ts
                editedTodo: null,
                intention: 'all', // Default: all
                dragIndex: '',
                enterIndex: '',
                show: true,
                delayTime: '1',
                isShow: window.innerWidth < 768,
                shortCut: window.innerWidth < 768 ? '≡' : '≡ Quicks',
                popShow: true,
                windowWidth: document.documentElement.clientWidth,
                slogan: "",
                isEditing: false,
                originalSlogan: "",

                //Optimistic UI: timers de debounce por todo-id
                //Debaunce: esperamos 300ms antes de enviar la petición al back. Si el usuario vuelve a hacer clic,
                //reiniciamos el timer. Así, solo cuando el usuario deje de spamear se manda la petición al back.
                pendingTimers: {},   // { [todoId]: timeoutId }
                pendingStatus: {},   // { [todoId]: "completed" | "created" } — última acción pendiente
                isCreatingList: false,
            };
        },

        computed,
        methods,
        directives,
        watch,

        async mounted() {

            if (!this.initialData) {
                this.show = false;
                return;
            }

            //Definimos una fase de "carga" para evitar flashear los tips
            this.isLoading = true;

            // initialData ya trae todos + trash (ver init.js). Los juntamos en una única lista todos (definida en data)
            const todosData = this.initialData.todos  || [];
            const trashData = this.initialData.trash  || [];

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

            //Cargamos el array definido en data.
            this.todos = [...mappedTodos, ...mappedTrash];


            //Título (el front lo llama slogan)
            this.slogan = 
                this.initialData.title || 
                "Edit this title or the TODOs names with double-click :)";

            //UI setup (después de haber conseguido los datos)
            this.show = true;
            this.isLoading = false; //Termina la fase de "carga"
            
            window.onresize = () => {   // Attach window.onresize event to mounted function
                this.windowWidth = document.documentElement.clientWidth;
            };

            window.addEventListener('beforeunload', (e) => {
                const hasPendingTimers = Object.keys(this.pendingTimers).length > 0;
                const hasTempTodos = this.todos.some(t => t.id < 0);
                
                if (hasPendingTimers || hasTempTodos) {
                    e.preventDefault();
                    e.returnValue = 'Your info hasn\'t been saved on the cloud yet. Do you want to leave?';
                }
            });
        },
    })
}