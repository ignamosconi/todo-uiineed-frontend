## Intenciones de este fork 
El objetivo de este fork es añadir la capacidad de que los usuarios puedan crear una lista y obtener un link único. Esto permitirá que cualquier usuario con el link tenga acceso a esa lista en particular. 
Esto surge de la necesidad de acceder a la página web desde múltiples dispositivos, pero manteniendo su naturaleza de "no log-in" (ergo, la página no tendrá usuarios).

→ Este proyecto es un fork de uiineed-todo-list por @ricocc, bajo licencia MIT
<br/>
→ Repositorio original: https://github.com/ricocc/uiineed-todo-list

El backend que consume este front-end es el siguiente:  <br/>
→ https://github.com/ignamosconi/todo-uiineed-backend/

<br/> 
A continuación se muestra el readme del proyecto original, en inglés:
<br/> 
# Uiineed Todo List 介绍

# Introducing Uiineed Todo List
<img src="public/img/ricocc/preview-uiineed-todo-list-en.jpg" alt="ricocc-wechat" width="640" height="auto" style="border-radius:12px;display:inline-block;margin:12px;">

<img src="public/img/ricocc/preview-uiineed-todo-list-en-2.jpg" alt="ricocc-wechat" width="640" height="auto" style="border-radius:12px;display:inline-block;margin:12px;">

Using a Todo List is very common in work. There are many Todo List products on the market, whether they are desktop applications or mobile apps/mini-programs. These products often consider diverse user needs, developing various features, including some social attributes, and even inevitably containing advertisements.

My personal product requirements are: basic, clean and simple, no need for extra features, and visually satisfactory.

So I decided to try writing my own Todo List application, which can not only meet my different daily ideas and needs, but also allow me to decide the visual style, no matter how quirky, as long as I like it.

In the design, I referenced the Noted design specification from the Figma community by aakarshna, and made adjustments based on my own design. On the front-end, I used Vue 2.x and Sass, and tried to use base64 to reduce the number of files.


## Usage

To keep things as simple as possible, I used a CDN to import Vue, so there's no need to install anything - just download and open the html file to use it.

If you host it yourself, you can also customize the personal information displayed on the page. To avoid interference with the experience, I've commented this out by default. If you need it, just uncomment and modify the information to your own.

The personal information section is as follows:

```html
<!-- Custom Info -->
    <div class="nav">
        <!-- Github Address -->
        <!-- <div class="github">
            <a href="https://github.com/ricocc/uiineed-todo-list?ref=opensource-todo" target="_blank" class="social-link">
                <img src="public/img/social/github.svg" class="ic-social" alt="">
            </a>
        </div> -->
        <!-- <div class="about">
                ...Customized personal information, hidden by default to avoid affecting the experience
                ...If you want to display it, you can uncomment the code
        </div> -->

        <!-- Switch between Chinese and English pages -->
        <div class="language switch-language">
            <a href="javascript:void(0)" class="en active">En</a>
            <span>/</span>
            <a href="index-zh.html" target="_self" class="zh">中</a>
        </div>
    </div>
```

## Authors
- Rico's Blog <a href="https://blog.ricocc.com/" target="_blank">@Ricocc</a>
- 小红书：  <a href="https://www.xiaohongshu.com/user/profile/5f2b6903000000000101f51f" target="_blank">@Rico的设计漫想</a>
- X - <a href="https://x.com/ricouii" target="_blank">@Ricouii</a>

## Recommend
- <a href="https://github.com/ricocc/public-portfolio-site/" target="_blank">⭐Star Github- Ricocc's Blog </a>
- <a href="https://webinspo.uiineed.com/" target="_blank">💻 Web Design Inspiration</a>
- <a href="https://og.uiineed.com/" target="_blank">🖼 Free OG Image Generator</a>
- <a href="https://www.aiwnt.com/" target="_blank">🛠️ AI Web Novel Translator</a>
- <a href="https://gradientshub.com/" target="_blank">🎨Free Gradients Toolkits</a>



---



### 💜支持作者

如果觉得有所帮助的话，一点点支持就可以大大激励创作者的热情，感谢！

<img src="public/img/ricocc/zanshangma.jpg" alt="ricocc-wechat" width="280" height="auto" style="display:inline-block;margin:12px;">





## License

This project is licensed under the MIT license. See the [LICENSE](./LICENSE) file for more info.
