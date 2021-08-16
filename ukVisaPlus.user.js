// ==UserScript==
// @name         UK Visa enhancements
// @namespace    https://wpcomhappy.wordpress.com/
// @icon         https://raw.githubusercontent.com/soufianesakhi/feedly-filtering-and-sorting/master/web-ext/icons/128.png
// @version      1.28
// @description  Tool for enhancing UK Visa
// @author       Siew "@xizun"
// @match        https://visa.vfsglobal.com/mys/en/gbr/book-appointment*
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @require      http://code.jquery.com/ui/1.12.1/jquery-ui.js
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_notification
// @updateURL    https://github.com/kosiew/misc/raw/main/ukVisaPlus.user.js
// ==/UserScript==

;(function($){ //function to create private scope with $ parameter

    $.fn.multiline = function(text){
        this.text(text);
        this.html(this.html().replace(/\n/g,'<br/>'));
        return this;
    }

// ---- generic template code start ---    
    const d = (function () {
        const debug = true;
    
        function log(message, level=0) {
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
        
                if (level==0) {
                    styles.push('background: linear-gradient(#060dd3, #040647)');
                } else {
                    styles.push('background: linear-gradient(#D33106, #571402)');
                }
                
                const _styles = styles.join(';');
                console.log(`%c ${message}`, _styles);        }
                visa.setLogMessage(message);
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
            log: log,
            group: group,
            groupEnd: groupEnd,
            table: table
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

    function _gm_getValue(key, defaultValue) {
        const value = GM_getValue(key);
        if (value == undefined) {
            return defaultValue;
        }
        return value;
    }
    
    
// ---- generic template code end ---    

    const timer = (function () {
        let loop;

        let timerElement;

        function register(element) {
            timerElement = element;
        }

        function start(action, timerSeconds) {
            let elapsedSeconds = timerSeconds;
            loop =  setInterval(
                () => {
                    elapsedSeconds--;
                    timerElement.text(`Countdown to ${action} (seconds): ${elapsedSeconds}`);
                    if (elapsedSeconds < -5) {
                        location.reload();
                    } else if (elapsedSeconds <= 0) {
                        clearInterval(loop);
                    }
                },
                1000
            );
        }

        function stop() {
            clearInterval(loop);
            timerElement.text('Status: Stopped monitoring')
        }
        
        return {
            start,
            stop,
            register,
        };
    })();

    const visa = (function () {
        const KEY_MONITOR = 'MONITOR';
        const KEY_END_MONTH = 'END_MONTH';
        const DEFAULT_END_MONTH = 'November 2021';
        const VALUE_MONITOR_TRUE = 'MONITOR_YES';
        const VALUE_MONITOR_FALSE = 'MONITOR_NO';
        const INTERVAL_MINUTES = 10;
        const SHORT_WAIT_MILISECONDS = 10000;
        const DEFAULT_WAIT_MILISECONDS =  30000;
        const LONG_WAIT_MILISECONDS = 5*DEFAULT_WAIT_MILISECONDS;
        const CLICK_NEXT_MONTH_WAIT_MILISECONDS = DEFAULT_WAIT_MILISECONDS;
        const NOTIFICATION_TIMEOUT_MILISECONDS = 3000;
        const SCROLL_OFFSET = 20;
        const NOTIFY_ONLY_IF_AVAILABLE = true;
        const labelMonitor = 'Monitor months';
        const labelStopMonitor = 'Stop monitor months';
        const toggleButton = $(`<button id="monitor-months">${labelMonitor}</button>`);
        const inputEndMonth = $(`<input type="text" size="20" value="${DEFAULT_END_MONTH}" id="end-month" name="end_month" />`);
        const nextActionElement = $('<h4></h4>');
        const logMessageElement = $('<h5></h5>');
        const timerElement = $('<h5></h5>');
        const logMessages = [];
        const MAX_LOG_MESSAGES = 5;

        timer.register(timerElement);

        toggleButton.click( () => {
            const value = getMonitorValue();
            const newValue = value == VALUE_MONITOR_TRUE ? VALUE_MONITOR_FALSE : VALUE_MONITOR_TRUE;
            GM_setValue(KEY_MONITOR, newValue);
            setButtonLabel();
            if (isMonitoring()) {
                location.reload();
            } else {
                timer.stop();
            }
        });



        function setEndMonth() {
            const endMonth = _gm_getValue(KEY_END_MONTH, DEFAULT_END_MONTH);
            inputEndMonth.val(endMonth);
        }
       

        function _setTimeout(action, f, timeout) {
            const _message = `${action} after ${timeout/1000} seconds`;
            nextActionElement.text(action);
            timer.start(action, timeout/1000);
            timerLoop = setTimeout(
                () => {
                    nextActionElement.text('');
                    f();
                }
                , timeout);
        }

        function getEndMonth() {
            const endMonth = inputEndMonth.val();
            GM_setValue(KEY_END_MONTH, endMonth);
            return endMonth;
        }
        function scrollToAnchor(aid){
            let aTag = $("#"+ aid);
            let top = aTag.offset().top - SCROLL_OFFSET;
            $('html,body').animate({scrollTop: top}, 'slow');
        }

        function isLoading() {
            const loaderOverlay = $('#dvLoader.show');
            return loaderOverlay.length > 0;
        }

        function monitorMonth(month) {
            if (isMonitoring()) {
                d.log(`monitorMonth ${month}`);

                if (isLoading()) {
                    location.reload();
                } else {
                    scrollToAnchor('monitor-months');                

                    const daysInMonth = getDaysInMonth(month);

                    const unavailableDayElements = $('td .day.unavailable_service');
                    const unavailableDays = unavailableDayElements.length;
                    const availableDays = daysInMonth - unavailableDays;
                    d.log(`${month} - ${daysInMonth} daysInMonth - ${unavailableDays} unavailable days`);
                    const message = `${availableDays} days in ${month} with available appointments`;
                    d.log(message);

                    const notify = (NOTIFY_ONLY_IF_AVAILABLE && availableDays > 0) || !NOTIFY_ONLY_IF_AVAILABLE;

                    if (notify) {
                        GM_notification ( {
                            title: 'Monitor Visa appointments', 
                            text: message, 
                            image: 'https://i.stack.imgur.com/geLPT.png',
                            timeout: NOTIFICATION_TIMEOUT_MILISECONDS,
                            onclick: () => {
                                    console.log ("My notice was clicked.");
                                    window.focus ();
                            }
                        } );
                    }
                }
            }

        }

        function clickNextMonth() {
            if (isMonitoring()) {
                const rightArrow = $('.arrow-right-icon');
                if (rightArrow.length > 0) {
                    rightArrow.click();
                } else {
                    location.reload();
                }
            }
            scrollToAnchor('monitor-months');
        }

        function isMonitoring() {
            const value = getMonitorValue();
            return value == VALUE_MONITOR_TRUE;
        }
        
        function monitorMonths() {
            d.log('monitorMonths');
            
            if (isMonitoring()) {
                    
                const endMonth = getEndMonth();
                const monthElement = $('table > tr.calendar-month-header > th:nth-child(2) > span');
                const month = monthElement.text();

                monitorMonth(month);

                if (month == endMonth) {
                    const action = `reloading`;
                    _setTimeout(
                        action,
                        () => {
                            location.reload();
                        },
                        LONG_WAIT_MILISECONDS
                    );
                } else {
                    const action = `clickNextMonth`;
                    _setTimeout(
                        action,
                        () => {
                            clickNextMonth();
                            const action = `monitorMonths`;
                            _setTimeout(
                                action,
                                () => {
                                    monitorMonths();
                                }, 
                               SHORT_WAIT_MILISECONDS 
                            );
                        },
                        CLICK_NEXT_MONTH_WAIT_MILISECONDS
                    )
                }
            } 
        }

        function getMonitorValue() {
            return _gm_getValue(KEY_MONITOR, VALUE_MONITOR_FALSE);
        }

        function setButtonLabel() {
            if (isMonitoring()) {
                toggleButton.text(labelStopMonitor);
            } else {
                toggleButton.text(labelMonitor);
            }
        }

        function getDaysInMonth(month) {
            // expect eg August 2021
            const d = new Date(month);
            const ed = new Date(d.getYear(), d.getMonth()+1, 0).getDate();
            return ed;
        }

        function setLogMessage(message) {
            if (logMessages.length > MAX_LOG_MESSAGES) {
                logMessages.shift();
            }
            logMessages.push(message);
            const messages = logMessages.join('\n');
            logMessageElement.multiline(messages);
        }
    
        function addToggleButton() {
            const h2 = $('.vas-container h2');
            h2.after(toggleButton);
            toggleButton.after(inputEndMonth);
            inputEndMonth.after(nextActionElement);
            nextActionElement.after(logMessageElement);
            logMessageElement.after(timerElement);
            setButtonLabel();
            setEndMonth();
        }
    
        return {
            addToggleButton,
            monitorMonths,
            setLogMessage,
            isMonitoring
        };
    })();

    d.log('loading ukVisa Plus');
    visa.addToggleButton();
    if (visa.isMonitoring()) {
        visa.monitorMonths();
    }

})(jQuery); //invoke nameless function and pass it the jQuery object

// version 1.00
// . initial release

// version 1.1
// . added scroll to anchor
// version 1.2
// . reload if no right arrow
// version 1.21
// . clickNextMonth shorter wait
// version 1.22
// . added LONG_WAIT for reload
// version 1.23
// . added elapsedSeconds
// version 1.24
// . start Monitoring - triggers reload
// version 1.25
// . stop countdown if elapsedSeconds < 0