//core/init.js
import { api } from "../api/todos.api.js";
import { state } from "./state.js";




//Loader helpers
export function showLoader(message = "Connecting...") {
    const loader = document.getElementById("app-loader");
    const msg    = document.getElementById("loader-message");
    if (loader) loader.classList.remove("hidden");
    if (msg)    msg.textContent = message;
}

export function hideLoader() {
    const loader = document.getElementById("app-loader");
    if (loader) loader.classList.add("hidden");
}


/*  
### INICIALIZACIÓN ###
*/
export async function initApp() {

    //Hasta que no conecta con backend, no cargamos la app.
    showLoader("Connecting...");

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
        return loadTodosWithRetry(state.listUrl);
    }

    /*
    CASO 2: El usuario entra a ROOT_FRONT/:url_lista, porque en otra sesión ya creó una lista y 
    guardó su URL para usarla después. El endpoint [GET] ROOT_BACK/todos/:url_lista ya valida si la lista existe.
    De ser así, cargamos los datos de [GET] ROOT_BACK/todos/:url_lista.

    Si la url_lista no existe, el front muestra un cartel que dice "Esa lista no existe. Presiona "ok" para crear
    una nueva (el único botón disponible). Tras seleccionar ok, se ejecuta el flujo del caso 1.
    */
    const url = path.slice(1);
    return loadTodosWithRetry(url);
}

//Retry loop (carga inicial)
async function loadTodosWithRetry(url) {
    const RETRY_INTERVAL_MS = 5000; // cada 5 segundos

    while (true) {
        const result = await loadTodos(url);

        if (result === "not_found") {
            // La lista no existe → crear una nueva (no reintentamos, es definitivo)
            return showListNotFound(url);
        }

        if (result !== null) {
            // Éxito
            hideLoader();
            return result;
        }

        // Falló la conexión → mensaje + esperar antes de reintentar
        showLoader("Retrying connection...");
        await sleep(RETRY_INTERVAL_MS);
        showLoader("Connecting...");
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


//Auxiliar 1
async function showListNotFound(url) {
    alert("That list URL doesn't exist. \nWe have created a new list for you c:");
    state.clear();
    return await createFlow();
}

//Auxiliar 2
export async function createFlow() {
    //Para el botón "new list", el llamador ya muestra el loader; para el caso inicial,
    //initApp ya lo mostró. Gestionamos esto acá.
    while (true) {
        try {
            const res = await api.createList();

            if (res.status === 429) {
                // Rate limited
                showLoader("Retrying connection...");
                await sleep(5000);  //Esperamos 5 segundos antes de conectar de nuevo.
                showLoader("Connecting...");
                continue;
            }

            if (!res.ok) {
                showLoader("Retrying connection...");
                await sleep(5000);
                showLoader("Connecting...");
                continue;
            }

            const data = await res.json();
            state.listUrl = data.url;
            window.history.replaceState({}, "", `/${data.url}`);

            const result = await loadTodosWithRetry(data.url);
            return result;

        } catch(error) {
            console.error(error);
            showLoader("Retrying connection...");
            await sleep(5000);
            showLoader("Connecting...");
        }
    }
}

//Auxiliar 3
async function loadTodos(url) {
    try {
        const [res, listRes] = await Promise.all([
            api.getTodos(url),
            api.getList(url)
        ]);

        if (res.status === 404) return "not_found";
        if (!res.ok || !listRes.ok) return null;

        const [data, list] = await Promise.all([res.json(), listRes.json()]);

        // Traemos también trash para tener todo desde el principio
        const trashRes = await api.getTrash(url);
        const trashData = trashRes.ok ? await trashRes.json() : [];

        state.listUrl = url;

        return {
            title: list.title,
            todos: data,
            trash: trashData,
        };

    } catch(error) {
        console.error(error);
        return null;
    }
}