1Liner - Query JSON with one tiny line of code
=========

[![build status](https://secure.travis-ci.org/jprichardson/string.js.png)](http://travis-ci.org/jprichardson/string.js)
[![CDNJS](https://img.shields.io/cdnjs/v/string.js.svg)](https://cdnjs.com/libraries/string.js)

`1Liner`, or simply `L` is a super fast and lightweight (**< 35 kb** minified and gzipped) JavaScript library for the browser or for Node.js that provides allows querying of JSON with one tiny line of code

Why?
----

Fetching data from a JS object can be cumbersome and always requires too much code. Wouldn't it be great to be able to fetch data from an JSON or JS object such with one simple line?

Take the following JS object:

```
{
    "proposer": {
    "title": "MR",
    "first_names": "Toadie",
    "last_names": "Ezakeeper",
    "age": 33,
    "address": {
        "line_1": "39944 Morissette Trail",
        "line_2": "Gulgowski Wells",
        "postcode": "AB13RT",
        "county": "Gloucestershire",
        "country": "GB"
    },
    "convictions": [{
        "code": "SP50",
        "points": 4,
    },
    {
        "code": "SP50",
        "points": 2,
    },
    {
        "code": "SP30",
        "points": 1,
    }],
    "claims": [{
        "code": "A",
        "at_fault": false,
    }]
}
```

1Liner allows you to get data from JSON quickly and easily:

```
proposer.address.postcode // "AB13RT" 
proposer.convictions.map(code) // ["SP50", "SP50", "SP30"]
proposer.convictions.count() // 3
proposer.convictions.min(points) // 1
proposer.convictions.max(points) // 4
proposer.convictions.range() // 3
proposer.convictions.mean() //2.33
proposer.convictions.filter(code=SP30) // ["SP30"]
proposer.convictions.filter(code!=SP30) // ["SP50", "SP50"]
proposer.convictions.filter(points>0).map(code) // ["SP50", "SP50"]
proposer.convictions.filter(points>=0).map(code) // ["SP50", "SP50", "SP30"]
proposer.convictions.filter(points<2).map(code) // ["SP30"]
proposer.convictions.filter(points<=2).map(code) // ["SP50", "SP30"]
proposer.convictions.filter(points<=2).filter(code=SP30).map(code) // ["SP30"]

```

Installation
------------

```
npm install --save 1liner
```

Usage
-----

### Node.js

```javascript
const L = require('1liner');

const obj = new L({
    proposer: {
        title: "MR",
        first_names: "Toadie",
        last_names: "Ezakeeper",
        age: 33,
        claims: [{
            code: "A",
            at_fault: false,
        }]
    }    
});

obj.query('proposer.title'); // "MR"
obj.query('proposer.claims.map(code)'); // ["A"]
obj.query('proposer.age') - 10; // 23
```

### Browsers

```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/gh/caljrimmer/1liner@latest/dist/index.js"></script>
```

A global variable `window.L` or simply `L` is created.


### AMD Support

It now [has AMD support](https://github.com/jprichardson/string.js/pull/20). See [require.js](http://requirejs.org/) on how to use with AMD modules.


### Browser Compatibility

`1Liner` has been designed to be compatible with Node.js and with IE6+, Firefox 3+, Safari 2+, Chrome 3+. Please [click here][browsertest] to run the tests in your browser.

Operators
-------

See [test file][testfile] for more details.

### - count

Counts the number of items in an array. It can be used after a filter has been applied.

Example:

```javascript
const L = require('1liner');

const obj = new L({
    proposer: {
        title: "MR",
        first_names: "Toadie",
        last_names: "Ezakeeper",
        age: 33,
        claims: [{
            code: "A",
            at_fault: false,
        },
        {
            code: "W",
            at_fault: false,
        }]
    }    
});

obj.query('proposer.claims.count()'); // 2
obj.query('proposer.claims.filter(code=W).count()'); // 1
```

### - min, max, mean, range

Finding the min integer, max integer and range between the two.

Example:

```javascript
const L = require('1liner');

const obj = new L({
    proposer: {
        title: "MR",
        first_names: "Toadie",
        last_names: "Ezakeeper",
        age: 33,
        convictions: [{
            code: "SP50",
            points: 4
        },
        {
            code: "SP30",
            points: 2
        }]
    }    
});

obj.query('proposer.convictions.min(points)'); // 2
obj.query('proposer.convictions.max(points)'); // 4
obj.query('proposer.convictions.range(points)'); // 2
obj.query('proposer.convictions.mean(points)'); // 3
```

### - map

Returns an array of the selected key within a collection of items.

Example:

```javascript
const L = require('1liner');

const obj = new L({
    proposer: {
        title: "MR",
        first_names: "Toadie",
        last_names: "Ezakeeper",
        age: 33,
        convictions: [{
            code: "SP50",
            points: 4
        },
        {
            code: "SP30",
            points: 2
        }]
    }    
});

obj.query('proposer.convictions.map(code)'); // ["SP50", "SP30"]
```

### - filter

Returns a filtered collection based on a criteria.

Filters work on strings and numbers. Dates will need to be converted in to numbers (UNIX timestamps) to be filtered.

Example:

```javascript
const L = require('1liner');

const obj = new L({
    proposer: {
        title: "MR",
        first_names: "Toadie",
        last_names: "Ezakeeper",
        age: 33,
        convictions: [{
            code: "SP50",
            points: 4
        },
        {
            code: "SP30",
            points: 2
        }]
    }    
});

obj.query('proposer.convictions.filter(code=SP30)'); // [{ code: "SP30", points: 2 }]
obj.query('proposer.convictions.filter(code=SP30).map(points)'); // [2]
obj.query('proposer.convictions.filter(code!=SP30).map(points)'); // [4]
obj.query('proposer.convictions.filter(points<4).map(code)'); // ["SP30"]
obj.query('proposer.convictions.filter(points<=4).map(code)'); // ["SP50", "SP30"]
obj.query('proposer.convictions.filter(points>2).map(code)'); // ["SP50"]
obj.query('proposer.convictions.filter(points>=2).map(code)'); // ["SP50", "SP30"]
```


Testing
-------

### Node.js

Install the dev dependencies:

    $ npm install 1liner --development

Then navigate to the installed directory:

    $ cd node_modules/1liner/

Run test package:

    $ npm test


Contributions
-------------

If you contribute to this library, just modify `index.js`, `index.spec.js`, and update `README.md`. I'll update the website docs and generate the new `dist/index.js`, changelog and version.


License
-------

Licensed under GNU GENERAL PUBLIC LICENSE.

Copyright (C) 2020 Callum Rimmer <callum@deadtrendy.co.uk>

[testfile]: https://github.com/caljrimmer/1liner/blob/master/__tests__/index.spec.js
[twitter]: http://twitter.com/caljrimmer
