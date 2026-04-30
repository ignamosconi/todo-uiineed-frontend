//vue/app.js
import { computed } from "./computed";
import { methods } from "./methods";
import { directives } from "./directives"
import { watch } from "./watch"

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
                checkEmpty: false,
                newTodoTitle: '',
                initialData,        //Usamos el que viene del main.ts
                editedTodo: null,
                intention: 'all', // Default: all
                dragIndex: '',
                enterIndex: '',
                show: true,
                delayTime: '1',
                isShow: false,
                shortCut: '≡ Quicks',
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

            // Traemos los todos (activos + trash)
            await this.refreshTodos()

            //Título (el front lo llama slogan)
            this.slogan = 
                this.initialData.title || 
                "Edit this title or the TODOs names with double-click :)";

            //UI setup (después de haber conseguido los datos)
            this.show = true;
            this.controlScreen();
            
            window.onresize = () => {   // Attach window.onresize event to mounted function
                this.windowWidth = document.documentElement.clientWidth;
            };
        },
    })
}