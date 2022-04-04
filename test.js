// ==UserScript==
// @name         ZZZZ enhancements
// @namespace    https://wpcomhappy.wordpress.com/
// @icon         https://raw.githubusercontent.com/soufianesakhi/feedly-filtering-and-sorting/master/web-ext/icons/128.png
// @version      1.0
// @description  Tool for enhancing XXXX
// @author       Siew "@xizun"
// @match        https://github.com/notifications
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @require      http://code.jquery.com/ui/1.12.1/jquery-ui.js
// @require      https://gist.github.com/raw/2625891/waitForKeyElements.js
// @require      https://unpkg.com/vue@2.6.12/dist/vue.min.js
// @require      https://unpkg.com/vue-select@3.11.2/dist/vue-select.js
// @resource     IMPORTED_CSS https://unpkg.com/vue-select@3.11.2/dist/vue-select.css
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

;(function($){ //function to create private scope with $ parameter

// ---- generic template code start ---    
    const SCRIPT_NAME = 'XXX Plus';
    const d = (function () {
        const debug = true;
    
        function log(...args) {
            if (debug) {
                const styles = [
                    'border: 1px solid #3E0E02'
                    , 'color: white'
                    , 'display: block'
                    , 'text-shadow: 0 1px 0 rgba(0, 0, 0, 0.3)'
                    , 'box-shadow: 0 1px 0 rgba(255, 255, 255, 0.4) inset, 0 5px 3px -5px rgba(0, 0, 0, 0.5), 0 -13px 5px -10px rgba(255, 255, 255, 0.4) inset'
                    , 'line-height: 20px'
                    , 'text-align: center'
                    , 'font-weight: bold'
                ]; 
                styles.push('background: linear-gradient(#06d10a, #040647)');
        
                const _styles = styles.join(';');
                console.log('%c ' + SCRIPT_NAME + ':', _styles, ...args);        }
        }
    
        function group(groupName = 'default') {
            if (debug) {
                console.group(groupName);
            }
        }
    
        function groupEnd() {
            if (debug) {
                console.groupEnd();
            }
        }
    
        function table(obj) {
            if (debug) {
                console.table(obj);
            }
        }
            
        return {
            log,
            group,
            groupEnd,
            table,
        };
    })();    
        
    
    function addBorder(elem) {
        elem.css('border', '2px solid red');
    }

    function addStyle() {
        const vue_select_css = GM_getResourceText("IMPORTED_CSS");
        GM_addStyle(vue_select_css);
        const css = ``;
        GM_addStyle(css);
    }

    function waitForKeyElements(selector, f) {
        const FAIL_STOP = 600;
        const INTERVAL = 100;
    
        function _monitorSelector() {
            return new Promise(
                (resolve, reject) => {
                    let i = 0;
                    const loop = setInterval(() => {
                        const elem = $(selector);
                        if (elem.length > 0 || i > FAIL_STOP) {
                            clearInterval(loop);
                            if (elem.length > 0) {
                                resolve();
                            } else {
                                reject(`loop-out:i`);
                            }
                        }
                        i++;
                    }, INTERVAL);
                }
            );
        }
    
        _monitorSelector(selector, f)
        .then(
            () => {
                f();
            }
        )
        .catch(
            (errorMessage) => {
                GM_notification ( {
                    title: 'Error', 
                    text: errorMessage, 
                    image: 'https://i.stack.imgur.com/geLPT.png'
                } );
            }
        );    
    }
    
// ---- generic template code end ---    

    d.log('loading ' + SCRIPT_NAME);
    


})(jQuery); //invoke nameless function and pass it the jQuery object

// version 1.00
// . initial release
