//vue/watch.js
export const watch = {
    todos: {
        handler() {
            const hasItemsInFilter = this.filteredTodos.length > 0;

            if (!hasItemsInFilter && this.intention !== 'all') {
                this.intention = 'all';
            }
        },
        deep: true
    }
};