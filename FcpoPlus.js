//ddtool/ ==UserScript==
// @name         Bursa enhancements
// @namespace    https://wpcomhappy.wordpress.com/
// @icon         https://raw.githubusercontent.com/soufianesakhi/feedly-filtering-and-sorting/master/web-ext/icons/128.png
// @version      1.42
// @description  Tool for enhancing Bursa
// @author       Siew "@xizun"
// @match        https://www.bursamalaysia.com/market_information/*
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @require      http://code.jquery.com/ui/1.12.1/jquery-ui.js
// @require      https://gist.github.com/raw/2625891/waitForKeyElements.js
// ==/UserScript==

;(function($){ //function to create private scope with $ parameter
    // FcpoPlus.js
    const TR_MONTH_INDEX = 2,
        MONTH_INDEX = 6,
        MAX_MONTH_INDEX = 9,
        MAX_DAY_DIFFERENCE = 14;
        MAX_DAYS_DATA = 31; 
        WAIT_MILISECONDS = 600000,
        CHANGE_THRESHOLD = 40,
        NOTIFICATION_TITLE = 'FCPO Alert';

    const KEY = 'FCPO';

    const _today = truncateDate(new Date()); // new Date(new Date().getFullYear(),new Date().getMonth() , new Date().getDate());
    const logMessagesElement = $('<h5></h5>');
    const timerElement = $('<h5></h5>');

    const TR_INDICES = {
        2: 'MONTH',
        6: 'LAST_DONE',
        12: 'SETTLEMENT',
        8: 'HIGH',
        9: 'LOW',
        10: 'VOLUME',
    }

    const options = {
        DEBUG: true,
    };

    $.fn.multiline = function(text){
      this.text(text);
      this.html(this.html().replace(/\n/g,'<br/>'));
      return this;
  }


    // for debugging
    const d = (function () {
        const debug = true;
        const messages = [];
        const MAX_LOG_MESSAGES = 5;

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
                setLogMessage(message);
        }

        function setLogMessage(message) {
            if (messages.length > MAX_LOG_MESSAGES) {
              messages.shift();
            }
            messages.push(message);
            const msg = messages.join('\n');
            logMessagesElement.multiline(msg);
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
                  timerElement.text(`Countdown to ${action} (seconds): ${elapsedSeconds}`);
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


    function jQueryIsLoaded() {
        return (typeof $== 'function');
    }

    function isJquery(elem) {
        return elem instanceof jQuery && elem.length > 0;
    }

    function addBorder(elem) {
        elem.css('border', '2px solid red');
    }

    //private scope and using $ without worry of conflict
    d.log('loading Fcpo Plus');

    let selector = '#app > div > div.chat > div.chat__chat-queue > div.action-bar > div';

    function askNotificationPermission() {
        d.log('askNotificationPermission+');
        // function to actually ask the permissions
        function handlePermission(permission) {
          // Whatever the user answers, we make sure Chrome stores the information
          if(!('permission' in Notification)) {
            Notification.permission = permission;
          }
    }

        // Let's check if the browser supports notifications
        if (!('Notification' in window)) {
          console.log("This browser does not support notifications.");
        } else {
          if(checkNotificationPromise()) {
            Notification.requestPermission()
            .then((permission) => {
              handlePermission(permission);
            })
          } else {
            Notification.requestPermission(function(permission) {
              handlePermission(permission);
            });
          }
        }
    }
    function checkNotificationPromise() {
        try {
          Notification.requestPermission().then();
        } catch(e) {
          return false;
        }

        return true;
    }

    function notify(message) {
        const notification = new Notification(NOTIFICATION_TITLE, {body: message});
    }

    function getDecimalHours() {
        const d = new Date();
        const h = d.getHours();
        const m = d.getMinutes();

        const decimalHours = h + m/60;
        return decimalHours;
    }

    function truncateDate(d) {
        const result = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        return result;
    }
    // date2 - date1
    function getDayDifference(date1, date2 = _today) {
        // new Date(new Date().getFullYear(),new Date().getMonth() , new Date().getDate())
        const d1 = truncateDate(date1);
        const d2 = truncateDate(date2);
        const differenceInTime = d2 - d1;

        // To calculate the no. of days between two dates
        const differenceInDays = differenceInTime / (1000 * 3600 * 24);
        return differenceInDays;
    }

    const arr = (function () {
        function intersect(arrA, arrB) {
            const intersection = arrA.filter(x => arrB.includes(x));
            return intersection;
        }

        // in arrA not in arrB
        function difference(arrA, arrB) {
            const _difference = arrA.filter(x => !arrB.includes(x));
            return _difference;
        }

        function symmetricalDifference(arrA, arrB) {
            const _difference = arrA
                    .filter(x => !arrB.includes(x))
                    .concat(arrB.filter(x => !arrA.includes(x)));
            return _difference;
        }

        function union(arrA, arrB) {
            const _union = [...arrA, ...arrB];
            return _union;
        }

        return {
            union: union,
            symmetricalDifference: symmetricalDifference,
            difference: difference,
            intersect: intersect
        }
    })();

/*
Solution of: https://www.codewars.com/kata/545434090294935e7d0010ab
source: https://gist.github.com/kopiro/4f75505a0c89269cf83ec5eacf6bae76
https://www.codewars.com/kata/545434090294935e7d0010ab/train/javascript

{
  select: ...,
  from: ...,
  where: ...,
  orderBy: ...,
  groupBy: ...,
  having: ...,
  execute: ...
}

function aug(row) {
    return row.MONTH == 'Aug 2021';
}

query().select().from(data).where(aug).execute();
*/


const query = function () {
    let self = {};
  
    let tables = [];
    let selector = null;
  
    let whereClauses = [];
    let havingClauses = [];
  
    let order = [];
    let group = [];
  
    let selectorAll = function (row) {
      return row;
    };
  
    self.select = function (e) {
      if (selector != null) throw new Error("Duplicate SELECT");
      selector = e || false;
      return self;
    };
  
    self.from = function () {
      if (tables.length > 0) throw new Error("Duplicate FROM");
      tables = Array.from(arguments);
      return self;
    };
  
    self.where = function () {
      whereClauses.push(Array.from(arguments));
      return self;
    };
  
    self.having = function () {
      havingClauses.push(Array.from(arguments));
      return self;
    };
  
    self.orderBy = function () {
      if (order.length > 0) throw new Error("Duplicate ORDERBY");
      order = Array.from(arguments);
      return self;
    };
  
    self.groupBy = function () {
      if (group.length > 0) throw new Error("Duplicate GROUPBY");
      group = Array.from(arguments);
      return self;
    };
  
    self.execute = function () {
      let tmpdata = [];
      let gdata = [];
  
      let data = [];
      let t = 0;
  
      // JOIN
  
      if (tables.length > 1) {
        tables.forEach(function () {
          data.push([]);
        });
  
        tables[0].forEach(function (row, i) {
          for (t = 0; t < tables.length; t++) {
            data[t].push(tables[t][i]);
          }
        });
  
        tmpdata = [];
        (function traverseTable(D, t) {
          if (D.length === 0) {
            tmpdata.push(t.slice(0));
          } else {
            for (let i = 0; i < D[0].length; i++) {
              t.push(D[0][i]);
              traverseTable(D.slice(1), t);
              t.splice(-1, 1);
            }
          }
        })(data, []);
  
        data = [];
        tmpdata.forEach(function (row, i) {
          if (
            whereClauses.every(function (orWhereClauses) {
              return orWhereClauses.some(function (whereClause) {
                return whereClause(row);
              });
            })
          ) {
            data.push(row);
          }
        });
      } else if (tables.length === 1) {
        tables[0].forEach(function (row, i) {
          if (
            whereClauses.every(function (orWhereClauses) {
              return orWhereClauses.some(function (whereClause) {
                return whereClause(row);
              });
            })
          ) {
            data.push(row);
          }
        });
      } else {
        data = [];
      }
  
      // Group
  
      if (group.length > 0) {
        let T = {};
  
        data.forEach(function (row) {
          let t = T;
          group.forEach(function (groupCallback) {
            let k = groupCallback(row);
            t[k] = t[k] || {};
            t = t[k];
          });
          t._data = t._data || [];
          t._data.push(row);
        });
  
        (function traverse(node, R) {
          if (node._data != null) {
            node._data.forEach(function (e) {
              R.push(e);
            });
          } else {
            for (let k in node) {
              k = /\d+/.test(k) ? Number(k) : k;
              let row = [k, []];
              traverse(node[k], row[1]);
              R.push(row);
            }
          }
        })(T, gdata);
  
        gdata.forEach(function (grow) {
          if (
            havingClauses.every(function (orHavingClauses) {
              return orHavingClauses.some(function (havingClause) {
                return havingClause(grow);
              });
            })
          ) {
            tmpdata.push(grow);
          }
        });
        data = tmpdata;
      }
  
      order.forEach(function (orderCallback) {
        data = data.sort(orderCallback);
      });
  
      return data.map(selector || selectorAll);
    };
  
    return self;
  };

    const fcpo = (function () {

        // get months D from bursa page
        function getMonthsD() {
            const trs = $('tbody tr');
            let monthsD = {};
            d.group('getMonthsD');
            for (let index = 0; index <= MAX_MONTH_INDEX; index++) {
                d.log(`index = ${index}`);
                const tr = trs.eq(index);
                const tds = tr.find('td');
                const monthValues = {};
                let monthD = {};
                let month;
                d.group('monthD');
                for (const [key, value] of Object.entries(TR_INDICES)) {
                    const td = tds[key];
                    const $td = $(td);
                    const columnValue = $td.text();
                    d.log(`${value} = ${columnValue}`);
                    if (key != TR_MONTH_INDEX) {
                        monthValues[value] = Number(columnValue.replace(',', ''));
                    } else {
                        month = columnValue;
                    }
                }
                monthD[month] = {...monthValues};
                d.table(monthD);
                d.groupEnd();
                monthsD = Object.assign(monthsD, monthD);
            }
            d.groupEnd();
            d.group('monthsD');
            d.table(monthsD);
            d.groupEnd();
            return monthsD;
        }

        const monthsD = getMonthsD();
        const fcpoToday = today();
        d.log(`today = ${fcpoToday}`);
        const todayD = {};
        todayD[fcpoToday] =  {...monthsD};
        d.group('todayD');
        d.table(todayD);
        d.groupEnd();
        d.group('today View - with max, min change');
        // view contains additional columns - RANGE (high - low), HIGH_CHANGE (high - settlement), LOW_CHANGE (low - settlement)
        const todayView = getMonthsView(monthsD);
        const maxRangeD = getMaxRange(todayView);
        d.table(todayView);
        d.groupEnd();
        const db = _gm_getValue(KEY, {});
        const newDb = Object.assign(db, todayD);
        const tableData = table(newDb);
        d.group('monthDaysView');
        const monthDaysView = getMonthDaysView(newDb);
        d.table(monthDaysView);
        d.groupEnd();

        deleteOldDates();

        GM_setValue(KEY, newDb);
        addToolTip(monthDaysView);

        function table(db) {
            d.group('table');
            const _rows = [];
            for (const [date, dateData] of Object.entries(db)) {
                for (const [month, monthData] of Object.entries(dateData)) {
                    const _row = {
                        DATE: date,
                        MONTH: month
                    };
                    const row = Object.assign(_row, monthData);
                    _rows.push(row);
                }
            }
            d.table(_rows);
            // add RANGE column
            const rows = _rows.map((row) => {
                row['RANGE'] = row.HIGH - row.LOW;
                return row;
            }); 
            d.groupEnd();
            return rows;
        }

        function addToolTip(mdv) {
            d.group('addToolTip');
            for (const [month, columns] of Object.entries(mdv)) {
                d.table(columns);
                d.log(`month: ${month}`);
                const tr = $(`tbody tr:contains(${month})`);
                if (tr.length > 0) {
                    const max = columns.MAX;
                    const min = columns.MIN;
                    const range = columns[0].RANGE;
                    tr.tooltip({
                        content: `Max: ${max}, Min: ${min}, Range: ${range}`
                    });
                }
            }
            d.groupEnd();
        }

        // get view of fcpo's day difference columns
        // eg July 2021     1 day ago - high, low, ......., 2 days ago - high, low ..., MAX:, MIN:
        function getMonthDaysView(datesMonthsD) {
            const monthsDaysView = {};
            for (const [date, monthsD] of Object.entries(datesMonthsD)) {
                const _date = new Date(date);
                const dayDifference = getDayDifference(_date);
                if (dayDifference < MAX_DAY_DIFFERENCE) {
                    const dayData = {};
                    for (const [month, columns] of Object.entries(monthsD)) {
                        d.group(`getMonthDaysView ${month} ${date} dayDifference ${dayDifference}`);
                        const monthD = monthsDaysView[month] || {};
                        dayData[dayDifference] = {...columns};
                        monthsDaysView[month] = Object.assign(monthD, dayData);
                        d.table(monthsDaysView[month]);
                        d.groupEnd();
                    }
                }
            }
            for (const [month, dayData] of Object.entries(monthsDaysView)) {
                let min = 99999;
                let max = 0;
                const lows = [];
                const highs = [];
                for (const [dayDifference, columns] of Object.entries(dayData)) {
                    if (columns.LOW < min) {
                        min = columns.LOW;
                    }
                    if (columns.HIGH > max) {
                        max = columns.HIGH;
                    }
                    lows.push(columns.LOW);
                    highs.push(columns.HIGH);
                }
                const _min = Math.min(...lows);
                const _max = Math.max(...highs);
                // if (_min != min) {
                //     alert(`_min ${_min} != min ${min}`);
                // }
                // if (_max != max) {
                //     alert(`_max ${_max} != max ${max}`);
                // }
                const minMaxD = {'MAX': max, 'MIN': min};
                const monthD = monthsDaysView[month] || {};
                monthsDaysView[month] = Object.assign(monthD, minMaxD);

            }
            d.group('getMonthDaysView');
            d.table(monthsDaysView);
            d.groupEnd();
            return monthsDaysView;
        }



        function getMaxRange(view) {
            const months = Object.keys(view);
            const interestedMonths = months.slice(2, 10);

            let max = 0;
            let maxRangeMonth = false;
            for (const [month, value] of Object.entries(view)) {
                if (interestedMonths.includes(month)) {
                    if (value.RANGE > max) {
                        max = value.RANGE;
                        maxRangeMonth = month;
                    }
                }
            }
            const maxD = {};
            maxD[maxRangeMonth] = max;
            return maxD;
        }

        function getDatesInDb(_db = newDb) {
            const dates = Object.keys(_db);
            return dates;
        }

        // gets single day's fcpo months extra columns - range, high_change, low_change
        function getMonthsView(singleDayMonthsData) {
            d.group('getMonthsView');
            const view = {...singleDayMonthsData};
            for (const [key, value] of Object.entries(singleDayMonthsData)) {
                d.log(`key = ${key}`);
                const monthData = singleDayMonthsData[key];
                const highChange = monthData.HIGH - monthData.SETTLEMENT;
                const lowChange = monthData.LOW - monthData.SETTLEMENT;
                monthData['RANGE'] = monthData.HIGH - monthData.LOW;
                monthData['HIGH_CHANGE'] = highChange;
                monthData['LOW_CHANGE'] = lowChange;
                view[key] = {...monthData};
            }
            d.groupEnd();
            return view;
        }

        function getNewDateAdded() {
            const dbDates = getDatesInDb(db);
            const newDbDates = getDatesInDb(newDb);
            const newDateAdded =  arr.difference(newDbDates, dbDates);
            return newDateAdded;
        }

        function deleteOldDates() {
            const newDateAdded =  getNewDateAdded();

            if (newDateAdded) {
                for (const [date, monthsD] of Object.entries(newDb)) {
                    const _d = new Date(date);
                    const dayDifference = getDayDifference(_d);
                    if (dayDifference > MAX_DAYS_DATA) {
                        delete newDb[date];
                        notify(`deleted ${date}`);
                    }
                }
            }
        }


        return {
            monthsD: monthsD,
            db:newDb,
            table: table,
            tableData: tableData,
            datesInDb: getDatesInDb,
            maxRangeD: maxRangeD,
            monthDaysView: monthDaysView
        };
    })();


    function monitorFcpo() {
        const maxRangeMonth = Object.keys(fcpo.maxRangeD)[0];
        const row = $(`table tr:contains(${maxRangeMonth})`);
        const $e = row.find('.stock_change');

        const change = parseInt($e.text());
        const abs_change = Math.abs(change);
        d.log(`change = ${change}`);
        if (abs_change > CHANGE_THRESHOLD) {
            const decimalHours = getDecimalHours();
            if ((decimalHours > 10.75 && decimalHours < 12.75) || (decimalHours > 14.75 && decimalHours < 18.26)) {
                const message = 'FCPO change is '.concat(change);
                notify(message);
            }
        }
    }

    function testNotification() {
        const title = 'test';
        const text = 'HEY! Your task "' + title + '" is now overdue.';
        const notification = new Notification('To do list', {body: text});

    }


    function flashScreen() {
        const container = $('.container.my-5');
        container.css('background', 'blue');
        setTimeout(
            () => {
                container.css('background', 'initial');
            },
            1000
        );
    }

    function highlightRow() {
        const maxRangeMonth = Object.keys(fcpo.maxRangeD)[0];
        // const row = $(`table tr:nth-child(${MONTH_INDEX + 1})`);
        const row = $(`table tr:contains(${maxRangeMonth})`);
        row.css('border', '2px solid red');
    }

    function today() {
        const _td = _today;
        let dd = _td.getDate();

        let mm = _td.getMonth()+1;
        const yyyy = _td.getFullYear();
        if(dd<10) {
            dd=`0${dd}`;
        }

        if(mm<10) {
            mm=`0${mm}`;
        }
        return `${yyyy}-${mm}-${dd}`;
    }


    function _gm_getValue(key, defaultValue) {
        const value = GM_getValue(key);
        if (value == undefined) {
            return defaultValue;
        }
        return value;
    }


    function saveFcpo() {
        d.group('dates in Databse');
        const datesInDb = fcpo.datesInDb();
        d.table(datesInDb);
        d.group('max range month');
        d.table(fcpo.maxRangeD);
        d.groupEnd();
        d.groupEnd();
    }

    function addToolTipStyle() {
        $("head").append (
            '<link '
          + 'href="https://code.jquery.com/ui/1.12.1/themes/smoothness/jquery-ui.css" '
          + 'rel="stylesheet" type="text/css">'
        );
    }

    function copyItemsToClipboard(items) {
        const WAIT_MILISECONDS_BETWEEN_COPY = 1000;
    
        const loop = setInterval(
            () => {
                if (items.length > 0) {
                    const item = items.shift();
                    // d.log('copying '.concat(item));
                    GM_setClipboard(item);
                } else {
                    clearInterval(loop);
                }
            },
            WAIT_MILISECONDS_BETWEEN_COPY
        );
    }
    

    function addDataButtons() {
        const searchButton = $('.btn-primary');
        const copyDataButton = $('<button>Copy history data</button>');
        copyDataButton.click(() => {
            const data = {'FCPO': {...fcpo.db}};
            const dataJson = JSON.stringify(data);
            const tableData = fcpo.tableData;
            const tableDataJson = JSON.stringify(tableData);
            const items = [dataJson, tableDataJson];
            copyItemsToClipboard(items);
            
        });
        searchButton.after(copyDataButton);
        copyDataButton.after(logMessagesElement);
        logMessagesElement.after(timerElement);
        timer.register(timerElement);
    }

    

    $(function() {
        askNotificationPermission();
        saveFcpo();
        highlightRow();
        monitorFcpo();
        addToolTipStyle();
        addDataButtons();

        const decimalHours = getDecimalHours();
        const reload = (decimalHours < 18.26);
        d.log(`decimalHours = ${decimalHours}, reload = ${reload}`);
        if (reload) {
            timer.setTimeOut(
                'reload',
                () => {
                    location.reload();
                },
                WAIT_MILISECONDS
            );
        }
        // do something on document ready
    }); // end ready

})(jQuery); //invoke nameless function and pass it the jQuery object


// version 1.1
// . save data
// . gets min, max over last 7 days
// . finds row with max range

// version 1.2
// . delete old data automatically

// version 1.3
// . added copyData button

// version 1.4
// . copyData - copy table too
// . added query() for sql

// version 1.41
// . commented out alert _min, _max