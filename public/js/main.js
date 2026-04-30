//main.js

import { initApp } from "./core/init.js";
import { createApp } from "./vue/app.js";

window.addEventListener("load", async () => {
    const initialData = await initApp();
    createApp(initialData);
});