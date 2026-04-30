//vue/computed.js

export const computed = {
    emptyChecked: function() {
        return this.newTodoTitle.length === 0 && this.checkEmpty
    },
    leftTodos: function() {
        return this.todos.filter(t => !t.completed && !t.removed);
    },
    leftTodosCount: function() {
        return this.leftTodos.length
    },
    hasRemovedTodo: function() {
        return this.todos.some(t => t.removed);
    },
    completedTodos: function() {
        return this.todos.filter(t => t.completed && !t.removed);
    },
    completedTodosCount: function() {
        return this.completedTodos.length
    },

    filteredTodos() {
        if (this.intention === 'ongoing') {
            return this.todos.filter(t => !t.completed && !t.removed);
        } 
        else if (this.intention === 'completed') {
            return this.todos.filter(t => t.completed && !t.removed);
        } 
        else if (this.intention === 'removed') {
            return this.todos.filter(t => t.removed);
        } 
        else {
            return this.todos.filter(t => !t.removed);
        }
    },

    hasTextSelection() {
        return window.getSelection().toString().length > 0;
    },

    showEmptyTips() {
        return this.filteredTodos.length === 0 && this.intention !== 'removed';
    }
}