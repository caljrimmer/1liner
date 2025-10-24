1Liner
=======

[![build status](https://secure.travis-ci.org/caljrimmer/1liner.png)](https://travis-ci.com/caljrimmer/1liner)
[![version](https://img.shields.io/github/package-json/v/caljrimmer/1liner)](https://github.com/caljrimmer/1liner/blob/master/package.json)
[![downloads](https://img.shields.io/npm/dm/1liner)](https://www.npmjs.com/package/1liner)

**1Liner**, or simply **L** is a super fast (10000 query executions take 150ms) and lightweight (**< 35 kb** minified) JavaScript library for the browser or for Node.js that allows querying of JSON with one tiny line of code.

Why?
----

Fetching data from a JSON can be cumbersome and always requires too much code. Wouldn't it be great to be able to fetch data, quickly, from a JSON with one simple line?


```javascript
const QL = require('1liner');
const obj = new QL({
    propose: {
        address: {
            line_1: "39944 Morissette Trail",
            line_2: "Gulgowski Wells",
            postcode: "AB13RT",
            county: "Gloucestershire",
            country: "GB"
        },
        convictions: [{
            code: "SP50",
            points: 4,
        },
        {
            code: "SP50",
            points: 2,
        },
        {
            code: "SP30",
            points: 1,
        }]
    },
    additional_drivers: [{
        name: 'Ted',
        age: 24
    }, {
        name: 'Mary',
        age: 30
    }]
});

/*
* Normal object syntax
*/ 
obj.query('proposer.address.postcode'); // "AB13RT" 

/*
* Normal object then map on array element
*/ 
obj.query('proposer.convictions.map(code)'); // ["SP50", "SP50", "SP30"]

/*
* Normal object then chain array element filter on filter
*/ 
obj.query('proposer.convictions.filter(points<=2).filter(code=SP30).map(code)'); // ["SP30"]
obj.query('proposer.convictions.filter(points<=2).filter(code="SP30").map(code)'); // ["SP30"]

/*
* Array first element so filter applied immediately
*/ 
obj.query('additional_drivers.filter(age>24).map(name)'); // ["Mary"]
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
const QL = require('1liner');

const obj = new QL({
    proposer: {
        title: "MR",
        first_names: "John",
        last_names: "Smith",
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

Operators
-------

See [test file][testfile] for more details.

### - count

Counts the number of items in an array. It can be used after a filter has been applied.

Example:

```javascript
const QL = require('1liner');

const obj = new QL({
    proposer: {
        title: "MR",
        first_names: "John",
        last_names: "Smith",
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
obj.query('proposer.claims.filter(code="W").count()'); // 1
```

### - min, max, mean, range, sum

Finding the min integer, max integer and range between the two.

Example:

```javascript
const QL = require('1liner');

const obj = new QL({
    proposer: {
        title: "MR",
        first_names: "John",
        last_names: "Smith",
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

obj.query('proposer.convictions.map(points).min()'); // 2
obj.query('proposer.convictions.map(points).max()'); // 4
obj.query('proposer.convictions.map(points).range()'); // 2
obj.query('proposer.convictions.map(points).mean()'); // 3
obj.query('proposer.convictions.sum(points)'); // 6
obj.query('proposer.convictions.map(points).sum()'); // 6

/**
 * Defaulting result on min, max, mean
 */
 
obj.query('proposer.convictions.filter(points=0).min(10)'); // 10
obj.query('proposer.convictions.filter(points=0).max(1)'); // 1
obj.query('proposer.convictions.filter(points=0).mean(3)'); // 3

```


### - map

Returns an array of the selected key within a collection of items.

Example:

```javascript
const QL = require('1liner');

const obj = new QL({
    proposer: {
        title: "MR",
        first_names: "John",
        last_names: "Smith",
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

An additional parameter of **~** can be provided to match empty or null values too.

Example:

```javascript
const QL = require('1liner');

const obj = new QL({
    proposer: {
        title: "MR",
        first_names: "John",
        last_names: "Smith",
        age: 33,
        convictions: [{
            code: "SP50",
            points: 4
        },
        {
            code: "SP30",
            points: 2
        }],
        claims: [{
            code: "A",
            at_fault: false,
        },
        {
            code: "W",
            at_fault: true,
        }]
    }    
});

obj.query('proposer.convictions.filter(code=SP30)'); // [{ code: "SP30", points: 2 }]
obj.query('proposer.convictions.filter(code="SP30")'); // [{ code: "SP30", points: 2 }]
obj.query('proposer.convictions.filter(code=SP30).map(points)'); // [2]
obj.query('proposer.convictions.filter(code=SP30~).map(points)'); // [2] ~ means the value can be empty or null too
obj.query('proposer.convictions.filter(code!=SP30).map(points)'); // [4]
obj.query('proposer.convictions.filter(points<4).map(code)'); // ["SP30"]
obj.query('proposer.convictions.filter(points<=4).map(code)'); // ["SP50", "SP30"]
obj.query('proposer.convictions.filter(points>2).map(code)'); // ["SP50"]
obj.query('proposer.convictions.filter(points>=2).map(code)'); // ["SP50", "SP30"]
obj.query('proposer.convictions.filter(points>=2).map(code)'); // ["SP50", "SP30"]
obj.query('proposer.convictions.filter(points?=10).map(code)'); // ["SP50"] ?= means nearest (only numbers)
obj.query('proposer.claims.filter(at_fault=true).map(code)'); // ["W"]
obj.query('proposer.claims.filter(at_fault=false).count()'); // 1
```

### - filterdates

Returns a filtered collection from dates.

Dates, in the YYYY-MM-DD format, will be converted in to numbers (UNIX timestamps) and filtered.

Example:

```javascript
const QL = require('1liner');

const obj = new QL({
    proposer: {
        title: "MR",
        first_names: "John",
        last_names: "Smith",
        age: 33,
        convictions: [{
            code: "SP50",
            points: 4,
            date: '2014-01-01'
        },
        {
            code: "SP30",
            points: 2,
            date: '2018-01-01'
        }],
        claims: [{
            code: "A",
            at_fault: false,
            date: '2010-01-01'
        },
        {
            code: "W",
            at_fault: true,
            date: '2012-01-01'
        }]
    }    
});

obj.query('proposer.convictions.filterdates(date>now).count()'); // 0
obj.query('proposer.convictions.filterdates(date<now).count()'); // 2
obj.query('proposer.convictions.filterdates(date<2016-01-01).count()'); // 1
obj.query('proposer.claims.filterdates(date=now).count()'); // 0
obj.query('proposer.claims.filterdates(date?=2017-10-01).map(date).first()'); // 2018-01-01 ?= nearest
```

### - unique

Returns an array of the unique items.

Example:

```javascript
const QL = require('1liner');

const obj = new QL({
    proposer: {
        title: "MR",
        first_names: "John",
        last_names: "Smith",
        age: 33,
        convictions: [{
            code: "SP50",
            points: 4
        },
        {
            code: "SP50",
            points: 2
        }]
    }    
});

obj.query('proposer.convictions.unique(code).count()'); // 1
```

### - first, last

Returns an first or last element of an array as a value.

Example:

```javascript
const QL = require('1liner');

const obj = new QL({
    proposer: {
        title: "MR",
        first_names: "John",
        last_names: "Smith",
        age: 33,
        convictions: [{
            code: "SP30",
            points: 4
        },
        {
            code: "SP50",
            points: 2
        }]
    }    
});

obj.query('proposer.convictions.map(code).first()'); // SP30
obj.query('proposer.convictions.map(code).last()'); // SP50
```

### - exists

Checks if property value exists i.e. not null, undefined, empty string or 0.

Example:

```javascript
const QL = require('1liner');

const obj = new QL({
    proposer: {
        title: "MR",
        first_names: "John",
        middle_name: "",
        last_names: "Smith",
        age: 0,
        spouse: null
    }    
});

obj.query('proposer.middle_name.exists()'); // "false"
obj.query('proposer.age.exists()'); // "false"
obj.query('proposer.spouse.exists()'); // "false"
obj.query('proposer.title.exists()'); // "true"
```

### - default

If property is undefined then it will return a defined default number or string

Example:

```javascript
const QL = require('1liner');

const obj = new QL({
    proposer: {
        title: "MR",
        first_names: "John",
        middle_name: "",
        last_names: "Smith",
        age: 0,
        spouse: null
    }    
});

obj.query('proposer.country.default(GB)'); // "GB"
obj.query('proposer.country.default("GB")'); // "GB"
obj.query('proposer.height.default(180)'); // 180
obj.query('proposer.first_names.default("bob")'); // "John"
```

### - date, age

If property is a date, then you can use date() to find a hour, date, month or year from the date string, or use age() to find the age since now in hours, days, months or years.

Example:

```javascript
const QL = require('1liner');

const obj = new QL({
    proposer: {
        title: "MR",
        first_names: "John",
        dob: "1990-01-01",
        dob_format: "07/01/1990"
    }    
});

obj.query('proposer.dob.date(YY)'); // 1990
obj.query('proposer.dob.date(MM)'); // 1
obj.query('proposer.dob.date(DD)'); // 1
obj.query('proposer.dob.date(HH)'); // 0
obj.query('proposer.dob_format.date(UK)'); // 1990-01-07 formats UK date
obj.query('proposer.dob_format.date(US)'); // 1990-07-01 formats US date

//assuming the date now is 2022-01-01

obj.query('proposer.dob.age(YY)'); // 32
obj.query('proposer.dob.age(MM)'); // 384
obj.query('proposer.dob.age(DD)'); // 140160
obj.query('proposer.dob.age(HH)'); // 3363840
```

A second argument can be provided to point at a date in the object instead of using now. This must be a top-level key in the object.

```javascript
const QL = require('1liner');

const obj = new QL({
    created_at: '2022-01-01',
    proposer: {
        title: "MR",
        first_names: "John",
        dob: "1990-01-01"
    }    
});

obj.query('proposer.dob.age(YY, created_at)'); // 32
obj.query('proposer.dob.age(MM, created_at)'); // 384
obj.query('proposer.dob.age(DD, created_at)'); // 140160
obj.query('proposer.dob.age(HH, created_at)'); // 3363840
```

Date and age work with arrays.

```javascript
const QL = require('1liner');

const obj = new QL({
    created_at: '2022-01-01',
    proposer: {
        title: "MR",
        first_names: "John",
        dob: "1990-01-01",
        convictions: [{
            code: "SP50",
            points: 4,
            date: "2019-01-01",
        },
        {
            code: "SP30",
            points: 2,
            date: "2020-01-01",
        }]
    }    
});

obj.query('proposer.convictions.map(date).age(YY, created_at)'); // [ 3 , 2 ]
obj.query('proposer.convictions.map(date).age(MM, created_at)'); // [ 36 , 24 ]
obj.query('proposer.convictions.map(date).age(DD, created_at)'); // [ 1095 , 730 ]

```



### - postcode

If property is a string postcode, then you can find the area and sector.

Example:

```javascript
const QL = require('1liner');

const obj = new QL({
    proposer: {
        title: "MR",
        first_names: "John",
        home_postcode: "W64TR",
    }    
});

obj.query('proposer.home_postcode.postcode(area)'); // W
obj.query('proposer.home_postcode.postcode(sector)'); // W64
```

### - regex

If property is a string, then you can use regex() to parse a regular expression against the string and return the first match.

Example:

```javascript
const QL = require('1liner');

const obj = new QL({
    proposer: {
        title: "MR",
        first_names: "John",
        home_postcode: "W64TR",
        shipping_postcode: "PO314RT"
    }    
});

obj.query('proposer.home_postcode.regex(^[A-Za-z]{2}|^[A-Za-z]{1})'); // W
obj.query('proposer.shipping_postcode.regex(^[A-Za-z]{2}|^[A-Za-z]{1})'); // PO
```

### Multiple Queries

Returns an result from multiple queries. The queries need to return numbers as values otherwise an error with be thrown. The queries can be replaced with numbers too.

Multi-query options are min, max or range.

Example:

```javascript
const QL = require('1liner');

const obj = new QL({
    proposer: {
        title: "MR",
        first_names: "John",
        last_names: "Smith",
        age: 33,
        height: 180,
        weight: 100,
        convictions: [{
            code: "SP50",
            points: 4
        },
        {
            code: "SP50",
            points: 2
        }]
    }    
});

obj.query('min([proposer.weight, proposer.height])'); // 100
obj.query('max([proposer.weight, proposer.height])'); // 180
obj.query('min([100, proposer.height])'); // 100
obj.query('max([100, proposer.height])'); // 180
obj.query('range([proposer.weight, proposer.height])'); // 80
```

### each.

Returns an array of results based on the query responses to each of the children queries. This is useful if you wish to aggregate each child node instead of all together. Each (each.) can only be used as the first segment declaration (i.e. first part of the query string) and can not be wrapped by min, max or range as the result can be integers, strings or nested arrays.

Example:

```javascript
const QL = require('1liner');

const obj = new QL({
    additional_drivers: [{
        title: "MR",
        first_names: "John",
        last_names: "Smith",
        age: 33,
        height: 180,
        weight: 100,
        convictions: [{
            code: "SP50",
            points: 4
        },
        {
            code: "SP50",
            points: 2
        }]
    },{
        title: "MRS",
        first_names: "Jane",
        last_names: "Smith",
        age: 30,
        height: 120,
        weight: 60,
        convictions: [{
            code: "SP10",
            points: 0
        }]
    }]    
});

obj.query('each.additional_drivers.map(convictions).count()'); // [2, 1]
obj.query('additional_drivers.map(convictions).count()'); // 3
obj.query('each.additional_drivers.map(convictions).map(code)'); // [['SP50', 'SP50'], ['SP10']]
obj.query('additional_drivers.map(convictions).map(code)'); // ['SP50', 'SP50', 'SP10']
```

### find

Returns an array of objects that match keys match the find value. This is useful if you wish to pick items from an object to make a collection and allow array methods. Find can only be used as the first segment declaration (i.e. first part of the query string) and can not be wrapped by min, max or range as the result can be integers, strings or nested arrays.

Example:

```javascript
const QL = require('1liner');

const obj = new QL({
    key_1: {
        "code": "SP10",
        "ban": true,
        "points": 1
    },
    key_2: {
        "code": "SP20",
        "ban": true,
        "points": 1
    },
    key_3: {
        "code": "SP30",
        "ban": true,
        "points": 1
    },
    key_11: {
        "code": "SP40",
        "ban": false,
        "points": 1
    }    
});

obj.query('find(key_).map(code)).first()'); // 'SP10'
obj.query('find(key_).map(code)'); // [ 'SP10', 'SP20', 'SP30', 'SP40' ]
obj.query('find(key_1).count()'); // 2
obj.query('find(key_).sum(points)'); // 4
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

Speed
-------

+ Small Object (2.5KB) - 10000 query executions takes *150ms*
+ Large Object (2.5MB) - 1000 query executions takes *1094ms*

Bundling
-------
```
npm run bundle
npm publish
```


Contributions
-------------

If you contribute to this library, just modify `index.js`, `index.spec.js`, and update `README.md`. I'll update the website docs and generate the new `dist/index.js`, changelog and version.

Alternative packages
-------------

The following packages allow more sophisticated querying of JSON.

* [JSONPath](https://github.com/json-path/JsonPath)
* [JMESPath](https://github.com/jmespath/jmespath.jsspath)

License
-------

Licensed under GNU GENERAL PUBLIC LICENSE.

Copyright (C) 2020 Callum Rimmer <callum@deadtrendy.co.uk>

[testfile]: https://github.com/caljrimmer/1liner/blob/master/__tests__/index.spec.js
[twitter]: http://twitter.com/caljrimmer
