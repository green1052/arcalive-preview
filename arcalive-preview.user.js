// ==UserScript==
// @name arcalive-preview
// @version 1.0.5
// @author green1052
// @description 아카라이브 게시글을 우클릭으로 미리 볼 수 있게 합니다.
// @match http*://arca.live/b/*
// @namespace arcalive-preview
// @rut-at document-start
// @noframes
// @license GPLv3
// @grant GM_xmlhttpRequest
// @require https://cdnjs.cloudflare.com/ajax/libs/js-cookie/2.2.1/js.cookie.min.js
// @homepageURL	https://github.com/green1052/arcalive-preview
// @downloadURL https://raw.githubusercontent.com/green1052/arcalive-preview/main/arcalive-preview.user.js
// ==/UserScript==

(() => {
    "use strict";

    /**
     * @param slug {string}
     * @param index {string}
     * @returns {Promise<unknown>}
     */
    async function getArticle(slug, index) {
        "use strict";

        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                url: `https://arca.live/api/app/view/article/${slug}/${index}`,
                headers: {
                    "user-agent": "live.arca.android/0.8.326",
                    "accept-encoding": "gzip"
                },
                responseType: "json",
                timeout: 5000,
                onload: (response) => {
                    resolve(response.response);
                },
                onerror: () => {
                    reject("error");
                },
                ontimeout: () => {
                    reject("timeout");
                }
            });
        });
    }

    function makePreview() {
        "use strict";

        const articles = document.querySelectorAll("a[class*=vrow]:not([data-preview])");

        for (const article of articles) {
            article.setAttribute("data-preview", "false");

            const div = document.createElement("div");
            div.className = "preview";
            div.style.position = "absolute";
            div.style.top = "2.3em";
            div.style.zIndex = "1";
            div.style.padding = "5px";
            div.style.border = "1px solid";
            div.style.borderRadius = "5px";
            div.style.width = "500px";
            div.style.height = "500px";
            div.style.boxSizing = "content-box";
            div.style.display = "none";
            div.style.overflow = "auto";

            if ((Cookies.get("display-config") !== undefined && JSON.parse(decodeURIComponent(Cookies.get("display-config")))["theme.background"] === "dark") || matchMedia("(prefers-color-scheme: dark)").matches) {
                div.style.backgroundColor = "var(--color-bg-main)";
                div.style.borderColor = "var(--color-border-outer)";
            } else {
                div.style.backgroundColor = "#fff";
                div.style.borderColor = "#bbb";
            }

            article.appendChild(div);

            article.addEventListener("contextmenu", async function (event) {
                event.preventDefault();

                /** @type Element */
                const article = this;

                const isPreview = !JSON.parse(article.getAttribute("data-preview"));

                article.setAttribute("data-preview", String(isPreview));

                const [, slug, index] = /\/b\/(.*)\/(\d*)\?p=\d/g.exec(article.getAttribute("href"));

                if (!slug || !index) return;

                if (article.querySelector(".vrow-preview") !== null)
                    article.querySelector(".vrow-preview").style.display = isPreview ? "none" : null;

                const preview = article.querySelector(".preview");
                preview.style.display = isPreview === true ? "initial" : "none";

                try {
                    const {content} = await getArticle(slug, index);
                    preview.innerHTML = `<div>${content}</div>`;
                } catch {

                }
            });
        }
    }

    const observer = new MutationObserver(makePreview);

    observer.observe(document.querySelector("div.list-table"), {
        childList: true,
        subtree: true
    });

    makePreview();
})();
