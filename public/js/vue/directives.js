//vue/directives.js

export const directives = {
    focus: {
        inserted: function(el) {
            el.focus()
        }
    }
}