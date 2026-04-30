// core/state.js

/*  
### STATE - Localstorage ###
Almacenamiento de URL de forma local (permite que con conectarse a ROOT_FRONT se 
pueda redirigir a la última lista creada)
*/
export const state = {
    //URL DE LISTA: Si el usuario se conecta a ROOT_FRONT, lo redirigimos a la última list_url que haya accedido.
    get listUrl() {
        return localStorage.getItem("list_url");
    },

    set listUrl(value) {
        localStorage.setItem("list_url", value);
    },

    clear() {
        localStorage.removeItem("list_url");
    }
};