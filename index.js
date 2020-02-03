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
const meanBy = require('lodash.meanby');
const sumBy = require('lodash.sumby');
const isUndefined = require('lodash.isundefined');
const unique = require('lodash.uniqby');

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
    'unique'
];

/**
 * Private functions
 */

function __getEquator(item) {
    let selected;
    equators.forEach(eq => { if(item.includes(eq)) selected = eq; });
    if (!selected) throw new Error(`Equator error: no equator exists for ${item}`);
    return selected;
}

function __checkOperator(element) {
    let check = false;
    operators.forEach(o => { if(element.includes(o + '(')) check = true; });
    if (!check && element.includes('(')) throw new Error(`Operator error: no operator exists for ${element}`);
    return check;
}

function __getOperatorValue(element, segment){
    const opValue = element.split('(').pop().split(')')[0];
    if (element.includes('count(')) return null;
    if (!opValue) throw new Error(`Operator error : No value in ${element} (in ${segment})`);
    if (opValue === '') throw new Error(`Operator error: No value in ${element} (in ${segment})`);
    return opValue;
}

function __recursive(obj, el, nextEl, segment) {
    if(!nextEl) return obj;
    const newObj = isArray(obj) ? obj : obj[el];

    // Check element is array and next element is an operator
    if(__checkOperator(nextEl)) {
        if (!isArray(obj[el]) && !isArray(obj)) {
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
        const value = item.split(equator)[1];
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
                return o[key] == value
            });
        }
    }

    if (nextEl.includes('unique(')) {
        const key =__getOperatorValue(nextEl, segment);
        return unique(newObj, key);
    }

    if (nextEl.includes('map(')) {
        const key =__getOperatorValue(nextEl, segment);
        return flatten(newObj.map(o => o[key]));
    }

    if (nextEl.includes('mean(')) {
        const key =__getOperatorValue(nextEl, segment);
        return round(meanBy(newObj, key), 2);
    }

    if (nextEl.includes('sum(')) {
        const key =__getOperatorValue(nextEl, segment);
        return round(sumBy(newObj, key), 2);
    }

    if (nextEl.includes('count(')) {
        return newObj.length;
    }

    if (nextEl.includes('min(')) {
        return min(newObj);
    }

    if (nextEl.includes('max(')) {
        return max(newObj);
    }

    if (nextEl.includes('range(')) {
        return max(newObj) - min(newObj);
    }
}

/**
 * 1Liner class
 */

class L {
    constructor (source){
        this.source = source;
    }

    query(segment) {
        // Clone source object
        let result = { ...this.source };
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