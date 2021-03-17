/**
* 1liner - Copyright (C) 2020, Callum Rimmer <callum@deadtrendy.co.uk>
*/


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
const sumBy = require('lodash.sumby');
const isUndefined = require('lodash.isundefined');
const unique = require('lodash.uniqby');
const isNumber = require('lodash.isnumber');

/**
 * Define equators
 */

const equators = [
    '=',
    '!=',
    '>',
    '>=',
    '<',
    '<=',
];

/**
 * Define array operators
 */

const operators = [
    'count',
    'map',
    'filter',
    'sum',
    'mean',
    'min',
    'max',
    'range',
    'unique',
    'exists',
    'default',
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
    equators.forEach(eq => { if(item.includes(eq)) selected = eq; });
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

function cleanStringQuotes(str = '') {
    return str.replace(/"/g, '').replace(/'/g, '');
}

function __recursive(obj = {}, el = '', nextEl, segment) {
    if(!nextEl) return obj;
    const newObj = isArray(obj) ? obj : obj[el];

    // Check element is array and next element is an operator
    if(__checkOperator(nextEl)) {
        if (!isArray(obj[el]) && !isArray(obj) && nextEl !=='exists()' && !nextEl.includes('default(')) {
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
        const key = item.split(equator)[0];
        const value = cleanStringQuotes(item.split(equator)[1]);
        if (equator === '!=') {
            return newObj.filter(o => o[key] != value);
        } else if (equator === '>') {
            return newObj.filter(o => o[key] > value);
        } else if (equator === '>=') {
            return newObj.filter(o => o[key] >= value);
        } else if (equator === '<') {
            return newObj.filter(o => o[key] < value);
        } else if (equator === '<=') {
            return newObj.filter(o => o[key] <= value);
        } else {
            return newObj.filter(o => {
                if(typeof o[key] === "boolean") return o[key].toString() == value;
                return o[key] == cleanStringQuotes(value);
            });
        }
    }

    if (nextEl.includes('unique(')) {
        const key =__getOperatorValue(nextEl, segment);
        return unique(newObj, key);
    }

    if (nextEl.includes('map(')) {
        const key =__getOperatorValue(nextEl, segment);
        return flatten(newObj.map((o) => {
            if (!o) throw new Error(`Path error: no ${key} in parent of query ${segment}`)
            return o[key];
        }));
    } 

    if (nextEl.includes('sum(')) {
        const key =__getOperatorValue(nextEl, segment);
        return round(sumBy(newObj, key), 2);
    }

    if (nextEl.includes('count(')) {
        return newObj.length;
    }

    if (nextEl.includes('exists(')) {
        return (newObj === '' || newObj === 0 || newObj === null || newObj === undefined).toString();
    }

    if (nextEl.includes('mean(')) {
        const def =__getOperatorValue(nextEl, segment);
        return round(mean(newObj), 2) || (def ? parseFloat(def) : 0);
    }

    if (nextEl.includes('min(')) {
        const def = __getOperatorValue(nextEl, segment);
        return min(newObj) || (def ? parseFloat(def) : 0);
    }

    if (nextEl.includes('max(')) {
        const def = __getOperatorValue(nextEl, segment);
        return max(newObj) || (def ? parseFloat(def) : 0);
    }

    if (nextEl.includes('range(')) {
        return (max(newObj) - min(newObj) || 0);
    }

    if (nextEl.includes('default(')) {
        const def = __getOperatorValue(nextEl, segment);
        return newObj || (isNaN(parseFloat(def)) ? cleanStringQuotes(def) : parseFloat(def));
    }
}

/**
 * 1Liner class
 */

class L {
    constructor (source){
        this.source = source;
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
                if (!isNaN(parseInt(q))) return round(q, 2);
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
        const elements = segment.split('.');

        // Return object
        if(!(__checkOperator(segment))){
            const obj = get(result, segment);
            if (isUndefined(obj)) throw new Error(`Path error : No object path for ${segment}`);
            return obj;
        }

        // Traverse object
        elements.forEach((el, i) => {
            const nextEl = elements[(i + 1)];
            result = __recursive(result, el, nextEl, segment);
        });
        if (isUndefined(result)) throw new Error(`Path error: No object path for ${segment}`);
        return result;
    }

    query(segment = '') {
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