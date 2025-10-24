/**
 * Lodash helpers
 */

const get = require('lodash.get');
const isArray = require('lodash.isarray');
const flatten = require('lodash.flatten');
const round = require('lodash.round');
const min = require('lodash.min');
const max = require('lodash.max');
const mean = require('lodash.mean');
const sum = require('lodash.sum');
const sumBy = require('lodash.sumby');
const isUndefined = require('lodash.isundefined');
const unique = require('lodash.uniqby');
const isNumber = require('lodash.isnumber');
const first = require('lodash.first');
const last = require('lodash.last');

/**
 * Define equators
 */

const equators = [
    '?=',
    '!=',
    '>=',
    '<=',
    '>',
    '<',
    '=',
];

/**
 * Define array operators
 */

const operators = [
    'count',
    'map',
    'filter',
    'filterdates',
    'sum',
    'mean',
    'min',
    'max',
    'range',
    'unique',
    'exists',
    'default',
    'age',
    'date',
    'postcode',
    'regex',
    'first',
    'last',
    'round',
];

/**
 * Private functions
 */

function __getMultipleQueries(segment = '', method = '', singleQuery) {
    const queries = segment.split(',')
        .map(s => {
            return s.replace(`${method}([`, '').replace('])', '').trim();
        })
        .map(q => {
            return singleQuery(q);
        });
    if (queries.filter(q => !isNumber(q)).length > 0) {
        throw new Error(`Query error: Only numbers can be returned for multiple query statements ${segment}`); 
    }
    return queries;
} 

function __getEquator(item = '') {
    let selected;
    equators.forEach(eq => { 
        // Checks for opertor
        if(item.includes(eq)) {
            // Makes sure this is the first instance of a operator
            const [ pre ] = item.split(eq);
            let check = true;
            equators.forEach(eq => {
                if (pre.includes(eq)) check = false;
            });
            // Only selected the first exact match
            if (!selected && check) {
                selected = eq; 
            }
        }
    });
    if (!selected) throw new Error(`Equator error: no equator exists for ${item}`);
    return selected;
}

function __checkOperator(element = '') {
    let check = false;
    operators.forEach(o => { if(element.includes(o + '(')) check = true; });
    if (!check && element.includes('(')) throw new Error(`Operator error: no operator exists for ${element}`);
    return check;
}

function __getOperatorValue(element = '', segment){
    const opValue = element.split('(').pop().split(')')[0];
    if (!opValue) {
        if (element.includes('count(') || element.includes('max(') || element.includes('min(') || element.includes('mean(')) return null;
        if (opValue === '') throw new Error(`Operator error: No value in ${element} (in ${segment})`);
        throw new Error(`Operator error : No value in ${element} (in ${segment})`);
    }
    return opValue;
}

function __getOptionalOperatorValue(element = '', segment){
    const opValue = element.split('(').pop().split(')')[0];
    return opValue;
}

function cleanString(str = '') {
    return str.replace(/"/g, '').replace(/'/g, '').trim();
}

function cleanNumber(num) {
    if (isNaN(Number(num))) throw new Error(`Type error: ${num} is not a number`);
    return num;
}

function __recursive(obj = {}, el = '', nextEl, segment, source) {
    if(!nextEl) return obj;
    let newObj = isArray(obj) ? obj : obj[el];

    // Assumes it is a string (postcode, age, regex can all work)
    if (!newObj) {
        const potential_string = (first(segment.split('.')) || '');
        if (potential_string.includes('"')) newObj = potential_string.replace(/"/g,'');
    }

    // Check element is array and next element is an operator
    if(__checkOperator(nextEl)) {
        if (!isArray(obj[el]) && 
            !isArray(obj) && 
            nextEl !=='exists()' && 
            !nextEl.includes('default(') &&
            !nextEl.includes('age(') &&
            !nextEl.includes('date(') &&
            !nextEl.includes('regex(') &&
            !nextEl.includes('postcode(')
        ) {
            throw new Error(`Path error: no object exists at ${el} (in ${segment}`);
        } 
    } else {
        if (!obj) throw new Error(`Path error: no object exists at ${el} (in ${segment}`);
        if (!obj[el]) throw new Error(`Path error: ${el} (in ${segment})`);
        if (isArray(obj[el])) throw new Error(`Array error: ${el}. (in ${segment}) should be followed by operator i.e. count(), filter() as it is an array`);
        return obj[el];
    }

    if (nextEl.includes('filter(')) {
        const item = __getOperatorValue(nextEl, segment);
        const equator = __getEquator(item);
        const equator_arr = item.split(equator);
        const key = cleanString(equator_arr[0]);
        let value = cleanString(equator_arr.slice(1, equator_arr.length).join(equator));

        if (value === 'now') {
            value = Math.floor(Date.now() / 1000);
            
        }
        // TODO if value = now then we are dealing with date

        let or_empty = false;

        function is_empty_check (value) {
            if (!or_empty) return false;
            let check = (value === '' || value === null || value === undefined);
            return check;
        }

        // Converts escaped decimal to real decimal; 
        if (value.includes('::')) value = Number(value.replace(/::/g,'.'));

        // ~ means it could be empty too
        if (value.includes('~')) {
            or_empty = true;
            value = value.replace('~', '');
        }

        // if collection value is '*' then always return true
        if (equator === '!=') {            
            return newObj.filter(o => o[key] != value || is_empty_check(o[key]) || o[key] === '*');
        } else if (equator === '>') {
            return newObj.filter(o => o[key] > cleanNumber(value) || is_empty_check(o[key]) || o[key] === '*');
        } else if (equator === '>=') {
            return newObj.filter(o => o[key] >= cleanNumber(value) || is_empty_check(o[key]) || o[key] === '*');
        } else if (equator === '<') {
            return newObj.filter(o => o[key] < cleanNumber(value) || is_empty_check(o[key]) || o[key] === '*');
        } else if (equator === '<=') {
            return newObj.filter(o => o[key] <= cleanNumber(value) || is_empty_check(o[key]) || o[key] === '*');
        } else if (equator === '?=') {
            let mapped = newObj.map(o => o[key]);
            if (mapped.includes('*')) return newObj.filter(o => o[key] === '*'); // return wildcard
            const nearest = newObj.filter(o => isNumber(o[key])).reduce((p, c) => (Math.abs(c[key] -  cleanNumber(value)) < Math.abs(p[key] -  cleanNumber(value)) ? c : p));
            return [ nearest ];
        } else {
            return newObj.filter(o => {
                // This deals with all boolean types true, 'true' or 'TRUE'
                if(typeof o[key] === "boolean") return o[key].toString() == value;
                if (typeof o[key] === "string" && o[key].toLowerCase() == 'true') return 'true'== value;
                if (typeof o[key] === "string" && o[key].toLowerCase() == 'false') return 'false' == value;
                return o[key] == cleanString(value) || is_empty_check(o[key]) || o[key] === '*';
            });
        }
    }

    if (nextEl.includes('filterdates(')) {
        const item = __getOperatorValue(nextEl, segment);
        const equator = __getEquator(item);
        const equator_arr = item.split(equator);
        const key = cleanString(equator_arr[0]);
        let value = cleanString(equator_arr.slice(1, equator_arr.length).join(equator));

        function toUnix(date) {
            // TODO check format is YYYY-MM-DD;
            return Math.floor(new Date(date) / 1000); 
        }

        if (value === 'now') {
            value = Math.floor(Date.now() / 1000);
        } else {
            value = toUnix(value);
        }

        if (equator === '!=') {
            return newObj.filter(o => toUnix(o[key]) != value || o[key] === '*');
        } else if (equator === '>') {
            return newObj.filter(o => toUnix(o[key]) > value || o[key] === '*');
        } else if (equator === '>=') {
            return newObj.filter(o => toUnix(o[key]) >= value || o[key] === '*');
        } else if (equator === '<') {
            return newObj.filter(o => toUnix(o[key]) < value || o[key] === '*');
        } else if (equator === '<=') {
            return newObj.filter(o => toUnix(o[key]) <= value || o[key] === '*');
        } else if (equator === '?=') {
            let mapped = newObj.map(o => o[key]);
            if (mapped.includes('*')) return newObj.filter(o => o[key] === '*'); // return wildcard
            const nearest = newObj.reduce((p, c) => (Math.abs(toUnix(c[key]) - value) < Math.abs(toUnix(p[key]) -  value) ? c : p));
            return [ nearest ];
        } else {
            return newObj.filter(o => {
                return toUnix(o[key]) == value;
            });
        }
    }

    if (nextEl.includes('unique(')) {
        const key =__getOperatorValue(nextEl, segment);
        return unique(newObj, key);
    }

    if (nextEl.includes('map(')) {
        let key =__getOperatorValue(nextEl, segment);
        return flatten(newObj.map((o) => {
            // Removed "" on strings
            key = key.replace(/"/g, '');
            if (!o) throw new Error(`Path error: no ${key} in parent of query ${segment}`)
            return o[key];
        }));
    } 

    if (nextEl.includes('sum(')) {
        const key =__getOptionalOperatorValue(nextEl, segment);
        if (!key) {
            return round(sum(newObj), 6);
        } else {
            return round(sumBy(newObj, key), 6);
        }
    }

    if (nextEl.includes('round(')) {
        const key =__getOperatorValue(nextEl, segment);
        return round(newObj, key);
    }

    if (nextEl.includes('count(')) {
        return newObj.length;
    }

    if (nextEl.includes('first(')) {
        return first(newObj);
    }

    if (nextEl.includes('last(')) {
        return last(newObj);
    }

    if (nextEl.includes('exists(')) {
        return (newObj === '' || newObj === 0 || newObj === null || newObj === undefined).toString();
    }

    if (nextEl.includes('date(') || nextEl.includes('age(')) {
        const def = __getOperatorValue(nextEl, segment);
        const format = (def.split(',')[0] || '').trim();
        const defined_date_path = (def.split(',')[1] || '').trim();

        if(!['YY', 'MM', 'DD', 'HH', 'UK', 'US'].includes(format)) {
            throw new Error(`Date error: in ${segment}) should be followed by eligible formatter i.e. YY, MM, DD, HH, UK, US`); 
        }

        function __generateDate(date_str) {
            function __checkDate(value, country = 'UK') {
                let date;
                try {
                    date = new Date(value)
                    if (date instanceof Date && !isNaN(date)) {
                        date = new Date(value)
                    } else {
                        throw new Error(`Date error: in ${segment}) the value is not a valid date`); 
                    }
                } catch(e) {
                    try {
                        if (country === 'UK') {
                            date = new Date(countryDate(date_str, 'UK'));
                        } else {
                            date = new Date(countryDate(date_str, 'US'));
                        }
                    } catch (e) {
                        throw new Error(`Date error: in ${segment}) the value is not a valid date`);
                    }  
                }
                return date
            }

            function countryDate(date_str, country = 'UK') {
                try {
                    if (date_str.split('-').length === 3) return date_str;
                    if (country === 'UK') {
                        return date_str.split('/')[2] + '-' + date_str.split('/')[1] + '-' + date_str.split('/')[0];
                    } else {
                        return date_str.split('/')[2] + '-' + date_str.split('/')[0] + '-' + date_str.split('/')[1];
                    }
                } catch (e) {
                    throw new Error(`Date error: in ${segment}) the value is not a valid date`); 
                }
            }

            const date = __checkDate(date_str, format);
            let now;

            if (defined_date_path) {
                // This only works will parent keys (i.e. top-level)
                const found_date = get(source, defined_date_path);
                now = __checkDate(found_date, format);
            } else {
                now = new Date(); 
            }
            let result;

            function getMonth(date) {
                date = date.getUTCMonth().toString();
                const map = {
                    '0': '01',
                    '1': '02',
                    '2': '03',
                    '3': '04',
                    '4': '05',
                    '5': '06',
                    '6': '07',
                    '7': '08',
                    '8': '09',
                    '9': '10',
                    '10': '11',
                    '11': '12',
                };
                return map[date];
            }

            if (nextEl.includes('date(')) {
                if (format === 'UK') {
                    result = countryDate(date_str, 'UK');
                } else if (format === 'US') {
                    result = countryDate(date_str, 'US');
                } else if (format === 'YY') {
                    result = date.getUTCFullYear();
                } else if (format === 'MM') {
                    result = getMonth(date).toString();
                } else if (format === 'DD') {
                    result = date.getUTCDate().toString();
                } else if (format === 'HH') {
                    result = date.getUTCHours().toString();
                } else if (format === 'UK') {
                    if (date_str.split('-').length === 3) return date_str;
                    result = date_str.split('/')[2] + '-' + date_str.split('/')[1] + '-' + date_str.split('/')[0];
                } else if (format === 'US') {
                    if (date_str.split('-').length === 3) return date_str;
                    result = date_str.split('/')[2] + '-' + date_str.split('/')[0] + '-' + date_str.split('/')[1];
                } else {
                    result = 0;
                }
            } else {

                const diff = (now.getTime() - date.getTime());
                const YY = Math.abs(new Date(diff).getUTCFullYear() - 1970); 

                const months = (YY * 12);
                const additional_month = new Date(
                    now.getTime() - 
                    (
                        new Date(
                            now.getUTCFullYear() + 
                            '-' + 
                            (date.getUTCMonth() + 1) + 
                            '-' + 
                            date.getUTCDate()
                        ) 
                    )
                ).getUTCMonth();

                const MM = months + additional_month;
                const DD = Math.floor(diff/ 1000 / (24 * 3600));
                const HH = DD * 24;

                if (format === 'DD') {
                    result = DD;
                } else if (format === 'MM') {
                    result = MM;
                } else if (format === 'YY') {
                    result = YY;
                } else if (format === 'HH') {
                    result = HH;
                } else {
                    result = 0;
                }
            }
            return result;
        }

        if (isArray(newObj)) {
            return newObj.map(n => __generateDate(n));
        } else {
            return __generateDate(newObj);
        }

    }

    if (nextEl.includes('regex(')) {
        let def =__getOperatorValue(nextEl, segment);
        let result;
        try {
            result = newObj.match(def);
        } catch (e) {
            throw new Error(`Type error: in ${segment}) the value is not a string`); 
        
        }
        return result && result.length ? result[0] : '';
    }

    if (nextEl.includes('postcode(')) {
        const def =__getOperatorValue(nextEl, segment);
        let result;
        try {
            if (def === 'sector') {
                result = newObj.match(/^[a-zA-Z]+\d\d?[a-zA-Z]?\s*\d+/);
            }
            
            if (def === 'area') {
                result = newObj.match(/^[A-Za-z]{2}|^[A-Za-z]{1}/);
            }
        } catch (e) {
            throw new Error(`Type error: in ${segment}) the value is not a string`); 
        
        }
        return result && result.length ? result[0] : '';
    }

    if (nextEl.includes('mean(')) {
        const def =__getOperatorValue(nextEl, segment);
        if (mean(newObj) === 0) return 0;
        return round(mean(newObj), 6) || (def ? parseFloat(def) : 0);
    }

    if (nextEl.includes('min(')) {
        const def = __getOperatorValue(nextEl, segment);
        if (min(newObj) === 0) return 0;
        return min(newObj) || (def ? parseFloat(def) : 0);
    }

    if (nextEl.includes('max(')) {
        const def = __getOperatorValue(nextEl, segment);
        if (max(newObj) === 0) return 0;
        return max(newObj) || (def ? parseFloat(def) : 0);
    }

    if (nextEl.includes('range(')) {
        return (max(newObj) - min(newObj) || 0);
    }

    if (nextEl.includes('default(')) {
        const def = __getOperatorValue(nextEl, segment);
        if (newObj === 0) return 0;
        return newObj || (isNaN(parseFloat(def)) ? cleanString(def) : parseFloat(def));
    }
}

/**
 * 1Liner class
 */

class L {
    constructor (source){
        this.source = source;
    }

    findQuery(segment) {
        let clean = segment.replace('find(', '')
        let [ key ] = clean.split(')');
        clean = clean.replace(key + ')', '');
        clean = `collection${clean}`;
        key = key.replace('"','').replace('"','').trim();
        let new_collection = Object.keys(this.source)
            .filter(k => {
                return k.includes(key);
            })
            .map(k => {
                return this.source[k]
            });
        const result = this.singleQuery(clean, { collection: new_collection });
        return result;
    }

    eachQuery(segment) {
        const clean = segment.replace('each.', '')
        const segments = clean.split('.');
        const first_segment = segments[0];
        const subsequent_segment = segments.splice(1, segments.length).join('.');
        const each_items = this.singleQuery(first_segment);
        const result = each_items.map(item_source => {
            return this.singleQuery(`item.${subsequent_segment}`, {
                item: [item_source]
            })
        });
        return result;
    }

    multiQuery(segment, method) {
        const queries = segment.split(',')
            .map(s => {
                return s.replace(`${method}([`, '').replace('])', '').trim();
            })
            .map(q => {
                // If number rather than query then just return
                if (!isNaN(parseInt(q))) return round(q, 6);
                return this.singleQuery(q);
            });
        if (queries.filter(q => !isNumber(q)).length > 0) {
            throw new Error(`Multi query error: Only numbers can be returned for multiple query statements ${segment}`); 
        }
        return queries;
    } 

    singleQuery(segment, amended_source) {
        // Clone source object
        let result = { ...(amended_source ? amended_source : this.source) };
        let new_segment = segment;
        let segment_map = {};

        // Moves (<value>) so that we can deal with decimals or . strings.
        (segment.match(/(?<=\()(.*?)(?=\))/gm) || []).map((r, i) => {
            const key = `::${i}::`;
            new_segment = new_segment.replace(r, key);
            segment_map[key] = r;
        });

        let elements = new_segment.split('.');

        // Replace (<value>) with original values again after split
        elements = elements.map(el => {
            Object.keys(segment_map).forEach(sm => {
                if (el.includes(sm)) el = el.replace(sm, segment_map[sm]);
            });
            return el;
        });

        // Return object
        if(!(__checkOperator(segment))){
            const obj = get(result, segment);
            if (isUndefined(obj)) throw new Error(`Path error : No object path for ${segment}`);
            return obj;
        }

        // Traverse object
        elements.forEach((el, i) => {
            const nextEl = elements[(i + 1)];
            result = __recursive(result, el, nextEl, segment, this.source);
        });
        if (isUndefined(result)) throw new Error(`Path error: No object path for ${segment}`);
        return result;
    }

    query(segment = '') {

        // Remove Bracket Wrapping
        if (segment.slice(0,1) === '(') {
            segment = segment.substring(1, segment.length);
            segment = segment.substring(0, segment.length - 1);
        }

        if (segment.startsWith('max([')) {
            const results = this.multiQuery(segment, 'max');
            return max(results);
        }

        if (segment.startsWith('min([')) {
            const results = this.multiQuery(segment, 'min');
            return min(results);
        }

        if (segment.startsWith('range([')) {
            const results = this.multiQuery(segment, 'range');
            return (max(results) - min(results) || 0)
        }

        if (segment.startsWith('each.')) {
            const results = this.eachQuery(segment, 'each');
            return results;
        }

        if (segment.startsWith('find(')) {
            const results = this.findQuery(segment);
            return results;
        }

        return this.singleQuery(segment);
    }
}

/**
 * Exporting
 */
  
if (typeof module !== 'undefined'  && typeof module.exports !== 'undefined') {
    module.exports = L;
} else {
    if(typeof define === "function" && define.amd) {
        define([], function() { return L; });
    } else {
        window.L = L;
    }
}