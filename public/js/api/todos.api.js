//api/todos.api.js
import { config } from "../config/config.js";

/*
### API ###
Definimos la constante "api", que realizará los feteches al backend. 

Este código NO MANEJA ERRORES (por ejemplo un cartel de alerta ante un fallo), ya que esto es una 
funcionalidad del frontend. 
*/
export const api = {
    //Definimos la url del backend
    base: config.API_URL,

    /*
        MÉTODOS MÓDULO "LISTS"
    */
    async createList() {
        return fetch(`${this.base}/lists`, { method: "POST"});
    },

    async getList(url) {
        return fetch(`${this.base}/lists/${encodeURIComponent(url)}`, { method: "GET"}); //url, title, creation_date
    },

    //Actualizar title de list
    async updateTitle(url, listTitle) {
        return fetch(`${this.base}/lists/${encodeURIComponent(url)}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify ({
                title: listTitle
            })
        })
    },
    
    /*
        MÉTODOS MÓDULO "TODOs"
    */

    //Si no pasamos el parámetro status, se obtienen 'todos' con status "created" y "completed", siempre y cuando isEliminated = false. 
    //Si pasamos el parámetro status = created o status = completed, se filtra solo por eso. 
    async getTodos(url, status) {
        const query = status ? `?status=${status}` : "";
        return fetch(`${this.base}/todos/${encodeURIComponent(url)}${query}`);                      
    },

    //Agregar todo
    async addTodo(url, todoName) {
        return fetch(`${this.base}/todos/${encodeURIComponent(url)}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify ({
                name: todoName
            })
        });
    },

    //Obtener todos con isEliminated = true (los que están en trash)
    async getTrash(url) {
        return fetch(`${this.base}/todos/${url}/trash`, {method: "GET"})
    },

    async reorder(url, id, beforeId, afterId) {
        if (beforeId === undefined && afterId === undefined) {
            throw new Error("Invalid reorder: need beforeId or afterId");
        }

        const body = { id };

        if (beforeId !== undefined) body.beforeId = beforeId;
        if (afterId !== undefined) body.afterId = afterId;

        return fetch(`${this.base}/todos/${encodeURIComponent(url)}/reorder`, {
            method: "PATCH",
            headers: {
            "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
    },

    //Actualizar status a "created" o "completed"
    async updateStatus(url, id, statusName) {
        return fetch(`${this.base}/todos/${encodeURIComponent(url)}/${id}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify ({
                status: statusName
            })
        })
    },

    //Actualizar name de todo (se hace con doble click en el front)
    async updateName(url, id, todoName) {
        return fetch(`${this.base}/todos/${encodeURIComponent(url)}/${id}/name`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: todoName
            })
        })
    },

    //Actualizar isEliminated de todo (define si se muestra en trash o no)
    async updateIsEliminated(url, id, todoIsEliminated) {
        return fetch(`${this.base}/todos/${encodeURIComponent(url)}/${id}/is-eliminated`, { 
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                isEliminated: todoIsEliminated
            })
        })
    },

    //Marcar a todos los 'todos' como status = completed, siempre y cuando isEliminated = false.
    async completeAll(url) {
        return fetch(`${this.base}/todos/${encodeURIComponent(url)}/complete-all`, {method: "PATCH"})
    },

    //Pasar a todos los 'todos' con status = completed a trash, es decir pasar su isEliminated a true.
    async clearCompleted(url) {
        return fetch(`${this.base}/todos/${encodeURIComponent(url)}/clear-completed`, {method: "PATCH"})
    }, 

    //Pasar todos los 'todos' con status: created o status: completed a trash (es decir, pasar su isEliminated a true)
    async clearAll(url) {
        return fetch(`${this.base}/todos/${encodeURIComponent(url)}/clear-all`, {method: "PATCH"})                        
    },

    //Pasar todos los 'todos' con isEliminated: false a isEliminated:true, manteniendo su estado anterior a ser eliminados.
    async restoreTrash(url) {
        return fetch(`${this.base}/todos/${encodeURIComponent(url)}/restore-trash`, {method: "PATCH"})  
    },

    //Eliminar de la bd todo lo que esté en trash
    async clearTrash(url) {
        return fetch(`${this.base}/todos/${encodeURIComponent(url)}/clear-trash`, {method: "DELETE"})  
    }

} 