// ==UserScript==
// @name         UK Visa enhancements
// @namespace    https://wpcomhappy.wordpress.com/
// @icon         https://raw.githubusercontent.com/soufianesakhi/feedly-filtering-and-sorting/master/web-ext/icons/128.png
// @version      1.34
// @description  Tool for enhancing UK Visa
// @author       Siew "@xizun"
// @match        https://visa.vfsglobal.com/mys/en/gbr/book-appointment*
// @match        https://visa.vfsglobal.com/mys/en/gbr/ukvihandshake
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
        let timerLoop;
        let timeoutLoop;

        let timerElement;

        function register(element) {
            timerElement = element;
        }

        function setTimeOut(action, f, timeout) {
            start(action, timeout/1000);
            timeoutLoop = setTimeout(
                () => {
                    f();
                }
                , timeout);
        }

        function start(action, timerSeconds) {
            let elapsedSeconds = timerSeconds;
            timerLoop =  setInterval(
                () => {
                    elapsedSeconds--;
                    timerElement.text(`Countdown to ${action} (${timerSeconds} seconds): ${elapsedSeconds}`);
                    if (elapsedSeconds < -5) {
                        location.reload();
                    } else if (elapsedSeconds <= 0) {
                        clearInterval(timerLoop);
                    }
                },
                1000
            );
        }

        function stop() {
            clearInterval(timerLoop);
            clearTimeout(timeoutLoop);
            timerElement.text('Status: Stopped monitoring')
        }
        
        return {
            start,
            stop,
            register,
            setTimeOut
        };
    })();

    const visa = (function () {
        const URL_CENTERS = 'https://visa.vfsglobal.com/mys/en/gbr/ukvihandshake';
        const URL_APPOINTMENTS = 'https://visa.vfsglobal.com/mys/en/gbr/book-appointment';
        const KEY_MONITOR_CENTER = 'MONITOR_CENTERS';
        const VALUE_MONITOR_CENTER_TRUE = 'MONITOR_YES';
        const VALUE_MONITOR_CENTER_FALSE = 'MONITOR_NO';
        const KEY_MONITOR_MONTH = 'MONITOR_MONTHS';
        const KEY_END_MONTH = 'END_MONTH';
        const DEFAULT_END_MONTH = 'November 2021';
        const VALUE_MONITOR_MONTH_TRUE = 'MONITOR_YES';
        const VALUE_MONITOR_MONTH_FALSE = 'MONITOR_NO';
        const SHORT_WAIT_MILISECONDS = 10000;
        const DEFAULT_WAIT_MILISECONDS =  30000;
        const LONG_WAIT_MILISECONDS = 3*DEFAULT_WAIT_MILISECONDS;
        const CLICK_NEXT_MONTH_WAIT_MILISECONDS = DEFAULT_WAIT_MILISECONDS;
        const NOTIFICATION_TIMEOUT_MILISECONDS = 3000;
        const SCROLL_OFFSET = 20;
        const NOTIFY_ONLY_IF_AVAILABLE = true;
        const labelMonitorMonths = 'Monitor months';
        const labelStopMonitorMonths = 'Stop monitor months';
        const labelMonitorCenters = 'Monitor centers';
        const labelStopMonitorCenters = 'Stop monitor centers';
        const toggleMonitorMonthsButton = $(`<button id="monitor-months">${labelMonitorMonths}</button>`);
        const toggleMonitorCentersButton = $(`<button id="monitor-centers">${labelMonitorCenters}</button>`);
        const testAvailableDaysButton = $(`<button id="test-available-days">Test available days</button>`);
        const inputEndMonth = $(`<input type="text" size="20" value="${DEFAULT_END_MONTH}" id="end-month" name="end_month" />`);
        const nextActionElement = $('<h4></h4>');
        const logMessageElement = $('<h5></h5>');
        const timerElement = $('<h5></h5>');
        const logMessages = [];
        const MAX_LOG_MESSAGES = 5;

        timer.register(timerElement);

        testAvailableDaysButton.click(
            () => {
                const days = $('td .day');
                days.removeClass('unavailable_service');
            }
        );

        toggleMonitorCentersButton.click( (e) => {
            e.preventDefault();
            const value = getMonitorCenterValue();
            const newValue = value == VALUE_MONITOR_CENTER_TRUE ? VALUE_MONITOR_CENTER_FALSE : VALUE_MONITOR_CENTER_TRUE;
            GM_setValue(KEY_MONITOR_CENTER, newValue);
            
            setMonitorCentersButtonLabel();
            if (isMonitoringCenters()) {
                location.reload();
            } else {
                timer.stop();
            }
        });
        
        toggleMonitorMonthsButton.click( () => {
            const value = getMonitorMonthValue();
            const newValue = value == VALUE_MONITOR_MONTH_TRUE ? VALUE_MONITOR_MONTH_FALSE : VALUE_MONITOR_MONTH_TRUE;
            GM_setValue(KEY_MONITOR_MONTH, newValue);
            setMonitorMonthsButtonLabel();
            getEndMonth();
            if (isMonitoringMonths()) {
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
            timer.start(action, timeout/1000);
            timerLoop = setTimeout(
                () => {
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
            if (isMonitoringMonths()) {
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
            if (isMonitoringMonths()) {
                const rightArrow = $('.arrow-right-icon');
                if (rightArrow.length > 0) {
                    rightArrow.click();
                } else {
                    location.reload();
                }
            }
            scrollToAnchor('monitor-months');
        }

        function isMonitoringMonths() {
            const value = getMonitorMonthValue();
            return value == VALUE_MONITOR_MONTH_TRUE;
        }
        
        function isMonitoringCenters() {
            const value = getMonitorCenterValue();
            return value == VALUE_MONITOR_CENTER_TRUE;
        }


        function getNoOfCentersElement() {
            const elem = $('#noOfCenter');
            return elem;
        }

        function monitorCenters() {
            d.log('monitorCenters');
            
            if (isMonitoringCenters()) {
                scrollToAnchor('monitor-centers');
                const svt = $('#SelectYourVisaType')
                svt.val('PV');
                const elem = getNoOfCentersElement();
                const numberOfCenters = parseInt(elem.text());
                const newCenters = 3 - numberOfCenters;
                const message = `There are ${newCenters} new centers`;
                d.log(message);
                if (newCenters > 0) {
                    GM_notification ( {
                        title: 'Number of Center', 
                        text: message, 
                        image: 'https://i.stack.imgur.com/geLPT.png',
                        timeout: options.NOTIFICATION_TIMEOUT_MILISECONDS,
                        }
                    );
                }         
                timer.setTimeOut(
                    'click Continue',
                    () => {
                        const button = $('input#btnMainHandshakeContinue');
                        button.click();
                    },
                    DEFAULT_WAIT_MILISECONDS
                )
            } 
        }


        function monitorMonths() {
            d.log('monitorMonths');
            
            if (isMonitoringMonths()) {
                    
                const endMonth = getEndMonth();
                const monthElement = $('table > tr.calendar-month-header > th:nth-child(2) > span');
                const month = monthElement.text();

                monitorMonth(month);

                if (month == endMonth) {
                    const action = `load Centers`;
                    timer.setTimeOut(
                        action,
                        () => {
                            location.href = URL_CENTERS;
                        },
                        LONG_WAIT_MILISECONDS
                    );
                } else {
                    const action = `clickNextMonth`;
                    timer.setTimeOut(
                        action,
                        () => {
                            clickNextMonth();
                            const action = `monitorMonths`;
                            timer.setTimeOut(
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

        function getMonitorMonthValue() {
            return _gm_getValue(KEY_MONITOR_MONTH, VALUE_MONITOR_MONTH_FALSE);
        }

        function getMonitorCenterValue() {
            return _gm_getValue(KEY_MONITOR_CENTER, VALUE_MONITOR_CENTER_FALSE);
        }

        function setMonitorMonthsButtonLabel() {
            if (isMonitoringMonths()) {
                toggleMonitorMonthsButton.text(labelStopMonitorMonths);
            } else {
                toggleMonitorMonthsButton.text(labelMonitorMonths);
            }
        }
        function setMonitorCentersButtonLabel() {
            if (isMonitoringCenters()) {
                toggleMonitorCentersButton.text(labelStopMonitorCenters);
            } else {
                toggleMonitorCentersButton.text(labelMonitorCenters);
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
    
        function addToggleMonitorMonthsButton() {
            const h2 = $('.vas-container h2');
            h2.after(toggleMonitorMonthsButton);
            h2.after(testAvailableDaysButton);
            toggleMonitorMonthsButton.after(inputEndMonth);
            inputEndMonth.after(nextActionElement);
            nextActionElement.after(logMessageElement);
            logMessageElement.after(timerElement);
            setMonitorMonthsButtonLabel();
            setEndMonth();

            const monitorCentersPage = $('<a href="https://visa.vfsglobal.com/mys/en/gbr/ukvihandshake" target="_blank">Click to open Monitor Centers page</a>');
            timerElement.after(monitorCentersPage);
        }

        function addToggleMonitorCentersButton() {
            const malaysiaP = $('p:contains(Malaysia)');
            malaysiaP.after(toggleMonitorCentersButton);
            toggleMonitorCentersButton.after(logMessageElement);
            logMessageElement.after(timerElement);

            setMonitorCentersButtonLabel();
        }
        
        return {
            addToggleMonitorCentersButton,
            addToggleMonitorMonthsButton,
            monitorMonths,
            setLogMessage,
            isMonitoringMonths,
            isMonitoringCenters,
            monitorCenters,
        };
    })();


    const href = location.href;
    d.log(`loading ukVisa Plus - ${href}`);

    if (href == 'https://visa.vfsglobal.com/mys/en/gbr/ukvihandshake') {
        visa.addToggleMonitorCentersButton();
        if (visa.isMonitoringCenters()) {
            visa.monitorCenters();
        }
    } else {
        visa.addToggleMonitorMonthsButton();
        if (visa.isMonitoringMonths()) {
            visa.monitorMonths();
        }
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