// ==UserScript==
// @name         Github Notification Plus
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  try to take over the world!
// @author       You
// @match        https://github.com/notifications
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        none
// ==/UserScript==

(function() {
    console.log(`%c==> [Loading Github Notifications]`, "color: yellow");
    const keep = ["bloom/web-client", "Automattic/support-helper-tools"];

    function insertAfter(referenceNode, newNode) {
        console.log(`%c==> [insertAfter]`, "color: yellow");
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }
      
    function unsubscribeNonKeep() {
        const selector = 'li.notification-unread';
        const elems = document.querySelectorAll(selector)
        
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
                button.click();
        });
        return nonKeepItems.length;
    }
    function unsubscribe() {
        console.log(`%c==> [unsubscribe]`, "color: yellow");
        let nonKeepCount;
        do {
            nonKeepCount = unsubscribeNonKeep();
        } while (nonKeepCount > 0);
        console.log(`%c==> [unsubscribe done]`, "color: yellow");
    }

    function addUnsubscribeButton() {
        console.log(`%c==> [addUnsubscribeButton]`, "color: yellow");
        const unsubscribeButton = document.createElement("button");
        unsubscribeButton.classList.add("btn", "BtnGroup-item");
        unsubscribeButton.innerHTML = 'Unsubscribe from non-keep repos';
        unsubscribeButton.onclick=unsubscribe;
   
        const selector = 'div.Header-item';
        const notification = document.querySelector(selector)

        const explore = function() {
            // eg '[title="element title attribute value"]'
            const selector = 'a.js-selected-navigation-item';
            const elems = document.querySelectorAll(selector);
            const result = [...elems].filter((e) => e.innerHTML == 'Explore');
            return result[0];
        }();

        insertAfter(explore, unsubscribeButton);
   
    }
    addUnsubscribeButton();    

    console.log(`%c==> [Github Notification Plus done]`, "color: yellow");
})();