// ==UserScript==
// @name         Github Notification Plus
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://github.com/notifications
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        none
// ==/UserScript==

(function() {
    const selector = 'li.notification-unread';
    const elems = document.querySelectorAll(selector)
    
    const keep = ["bloom/web-client"];
    const unreadNotificationItems = [...elems];
    
    const nonKeepItems = unreadNotificationItems.filter((elem) => {
        const repo = elem.querySelector('.d-flex p.m-0.f6.flex-auto');
        const repoText = repo.textContent.trim();
        for(const item of keep) {
            if (repoText.startsWith(item)) {
               return false;
            }
         }
         return true;
    });
    console.log(`%c  ==> [elems.length = ${elems.length}]`, "color: yellow");
    console.log(`%c ==> [nonKeepItems.length = ${nonKeepItems.length}]`, "color: yellow");
    
    nonKeepItems.forEach((curVal, index, array) => {
        const repo = curVal.querySelector('.d-flex p.m-0.f6.flex-auto');
        const repoText = repo.textContent.trim();
        if (!repoText.startsWith(keep)) {
            repo.style.border = '1px solid blue'}
            const button = curVal.querySelector('[title="Unsubscribe"]');
            // button.click();
    });
    console.log(`%c==> [Github Notification Plus done]`, "color: yellow");
})();