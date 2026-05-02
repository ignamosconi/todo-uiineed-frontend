//vue/app.js
import { computed } from "./computed.js";
import { methods } from "./methods.js";
import { directives } from "./directives.js"
import { watch } from "./watch.js"

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
                
                originalSlogan: ""
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

            // Traemos los todos (activos + trash)
            await this.refreshTodos()

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
        },
    })
}