//core/init.js
import { api } from "../api/todos.api.js";
import { state } from "./state.js";


/*  
### INICIALIZACIÓN ###
*/
export async function initApp() {

    //Detectamos la URL actual.
    const path = window.location.pathname;

    /*
    CASO 1: El usuario entra a ROOT_FRONT/ (es decir, la página principal) y no hay ninguna
    list_url guardada en localstorage, por lo que vamos a crearle una nueva lista y 
    asignarle una url_lista, con [POST] ROOT_BACK/lists.

    Tras crear la lista, el usuario será redirigido a ROOT_FRONT/url_lista, que va a cargar los 
    datos de [GET] ROOT_BACK/todos/url_lista. 

    La list_url creada se asigna al localstorage.
    */
    if (path === "/") {
        if (!state.listUrl) {
            return createFlow();
        }
        
        /*
        CASO 3: El usuario ingresa a ROOT_FRONT y ya existe una list_url guardada en 
        localstorage, por lo que se redirecciona a esa list_url con  ROOT_FRONT/list_url, 
        como se analizó en el paso 1.
        */
        window.history.replaceState({}, "", `/${state.listUrl}`);
        return loadTodos(state.listUrl);
    }

    /*
    CASO 2: El usuario entra a ROOT_FRONT/:url_lista, porque en otra sesión ya creó una lista y 
    guardó su URL para usarla después. El endpoint [GET] ROOT_BACK/todos/:url_lista ya valida si la lista existe.
    De ser así, cargamos los datos de [GET] ROOT_BACK/todos/:url_lista.

    Si la url_lista no existe, el front muestra un cartel que dice "Esa lista no existe. Presiona "ok" para crear
    una nueva (el único botón disponible). Tras seleccionar ok, se ejecuta el flujo del caso 1.
    */
    const url = path.slice(1); 

    const data = await loadTodos(url); //traemos también el título de la lista

    return data;
}

//Auxiliar 1
function showListNotFound(url) {
    const ok = alert("That list URL doesn't exist. \nWe've created a new list for you c:");

    if (ok) {
        state.clear();
        createFlow();
    }
}

//Auxiliar 2
export async function createFlow() {
    const res = await api.createList();

    if (!res.ok) {
        alert("Error creating list.");
        return;
    }

    const data = await res.json();

    state.listUrl = data.url;

    window.history.replaceState({}, "", `/${data.url}`);

    return loadTodos(data.url);
}

//Auxiliar 3
let isLoading = false;
async function loadTodos(url) {
    if (isLoading) return;
    isLoading = true;   //Evita que salte dos veces el cartel de "error cargando datos de la lista"

    try {
        //Todos
        const res = await api.getTodos(url);
        
        if (res.status === 404) {
            showListNotFound(url);
            return null;
        }

        if (!res.ok) {
            alert("Error cargando lista");
            return;
        }

        //Lista (lo usamos para el título)
        const listRes = await api.getList(url);

        if (!listRes.ok) {
            alert("Error updating list data.");
            return;
        }

        //Pasando en limpio
        const data = await res.json();
        const list = await listRes.json();
        state.listUrl = url;

        return {
            title: list.title,
            todos: data,
        }

    } finally {
        isLoading = false
    }
}