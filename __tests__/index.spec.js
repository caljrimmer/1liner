const Oneliner = require('../index');

const { times, random } = require('lodash');

const quote = require('../__mocks__/quote.json');

const bigQuote = {};

times(1000, (i) => {
    bigQuote[`quote_${i}`] = quote;
});



const L = new Oneliner(quote);

describe('1Liner', () => {

    describe('Error states', () => {
        it('FAIL - wrong path', async () => {
            expect(() => {
                L.query('incorrect.map(claims).map(code)');
            }).toThrowError(/Path error/);
        });

        it('FAIL - null', async () => {
            expect(() => {
                L.query();
            }).toThrowError(/Path error/);
        });

        it('FAIL - empty operator', async () => {
            expect(() => {
                L.query('proposer.claims.map()');
            }).toThrowError(/Operator error/);
        });

        it('FAIL - unknown operator', async () => {
            expect(() => {
                L.query('proposer.claims.incorrect()');
            }).toThrowError(/Operator error/);
        });

        it('FAIL - empty equator', async () => {
            expect(() => {
                L.query('proposer.claims.filter(code)');
            }).toThrowError(/Equator error/);
        });

        it('FAIL - no object found', async () => {
            expect(() => {
                L.query('proposer.claims.bob');
            }).toThrowError(/Path error/);
        });

        it('FAIL - Nested map does not exist', async () => {
            expect(() => {
                L.query('additional_drivers.map(conviction).map(code)');
            }).toThrowError(/Path error/);
        });

        it('FAIL - Multi Query returns not a number (string)', async () => {
            expect(() => {
                L.query('max([additional_drivers.map(ncd).max(), vehicle.reg])');
            }).toThrowError(/Multi query error/);
        });

        it('FAIL - Multi Query returns not a number (array)', async () => {
            expect(() => {
                L.query('min([additional_drivers.map(ncd).max(), proposer.convictions.map(points)])');
            }).toThrowError(/Multi query error/);
        });
    });

    describe('Object first', () => {
        it('PASS - object pass through', async () => {
            const result = L.query('proposer.employment');
            expect(result).toEqual('E')
        });

        it('PASS - count', async () => {
            const result = L.query('proposer.claims.count()');
            expect(result).toEqual(1);
        });

        it('PASS - min', async () => {
            const result = L.query('proposer.convictions.map(points).min()');
            expect(result).toEqual(0);
        });

        it('PASS - max', async () => {
            const result = L.query('proposer.convictions.map(points).max()');
            expect(result).toEqual(10);
        });

        it('PASS - range', async () => {
            const result = L.query('proposer.convictions.map(points).range()');
            expect(result).toEqual(10);
        });

        it('PASS - sum', async () => {
            const result = L.query('proposer.convictions.sum(points)');
            expect(result).toEqual(11);
        });

        it('PASS - mean', async () => {
            const result = L.query('proposer.convictions.map(points).mean()');
            expect(result).toEqual(3.67);
        });

        it('PASS - filter (string not quotes) = ', async () => {
            const result = L.query('proposer.claims.filter(code=A).map(code)');
            expect(result).toEqual(['A'])
        });

        it('PASS - filter (string " quotes)  =', async () => {
            const result = L.query('proposer.claims.filter(code="A").map(code)');
            expect(result).toEqual(['A'])
        });

        it(`PASS - filter (string ' quotes)  =`, async () => {
            const result = L.query(`proposer.claims.filter(code='A').map(code)`);
            expect(result).toEqual(['A'])
        });

        it(`PASS - filter (!=)`, async () => {
            const result = L.query(`proposer.claims.filter(code!=A).count()`);
            expect(result).toEqual(0)
        });

        it('PASS - unique =', async () => {
            const result = L.query('proposer.convictions.unique(code).count()');
            expect(result).toEqual(1);
        });

        it('PASS - exists true', async () => {
            const result = L.query('policy.address.line_3.exists()');
            expect(result).toEqual('true');
        });

        it('PASS - exists false', async () => {
            const result = L.query('policy.address.line_1.exists()');
            expect(result).toEqual('false');
        });

        it('PASS - date YY', async () => {
            const result = L.query('proposer.dob.date(YY)');
            expect(result).toEqual(2000);
        });

        it('FAIL - bad date', async () => {
            try {
                const result = L.query('policy.error_date.date(YY)');
            } catch(e) {
                expect(e.message).toEqual('Date error: in policy.error_date.date(YY)) the value is not a valid date');
            }
        });

        it('FAIL - date XX', async () => {
            try {
                const result = L.query('proposer.dob.date(XX)');
            } catch(e) {
                expect(e.message).toEqual('Date error: in proposer.dob.date(XX)) should be followed by eligible formatter i.e. YY, MM, DD, HH');
            }
        });

        it('PASS - date MM', async () => {
            const result = L.query('proposer.dob.date(MM)');
            expect(result).toEqual(7);
        });

        it('PASS - date DD', async () => {
            const result = L.query('proposer.dob.date(DD)');
            expect(result).toEqual(29);
        });

        it('PASS - date HH', async () => {
            const result = L.query('proposer.dob.date(HH)');
            expect(result).toEqual(0);
        });

        it('PASS - age YY', async () => {
            // This normalise the tests
            const inception = L.query('created_at.age(YY)');
            const age = L.query('proposer.dob.age(YY)');
            const result = Math.floor(age - inception);
            expect(result).toEqual(20);
        });

        it('PASS - age YY with top-level date pointer', async () => {
            const result = L.query('proposer.dob.age(YY, created_at)');
            expect(result).toEqual(19);
        });

        it('PASS - age MM', async () => {
            const inception = L.query('created_at.age(MM)');
            const age = L.query('proposer.dob.age(MM)');
            const result = Math.floor(age - inception);
            expect(result).toEqual(234);
        });

        it('PASS - age MM with top-level date pointer', async () => {
            const result = L.query('proposer.dob.age(MM, created_at)');
            expect(result).toEqual(233);
        });

        it('PASS - age DD', async () => {
            const inception = L.query('created_at.age(DD)');
            const age = L.query('proposer.dob.age(DD)');
            const result = Math.floor(age - inception);
            expect(result).toEqual(7095);
        });

        it('PASS - age DD with top-level date pointer', async () => {
            const result = L.query('proposer.dob.age(DD, created_at)');
            expect(result).toEqual(7095);
        });

        it('PASS - age HH', async () => {
            const inception = L.query('created_at.age(HH)');
            const age = L.query('proposer.dob.age(HH)');
            const result = Math.floor(age - inception);
            expect(result).toEqual(170280);
        });

        it('PASS - age HH with top-level date pointer', async () => {
            const result = L.query('proposer.dob.age(HH, created_at)');
            expect(result).toEqual(170280);
        });

        it('PASS - regex postcode', async () => {
            const result = L.query('policy.address.postcode.regex(^[A-Za-z]{2}|^[A-Za-z]{1})');
            expect(result).toEqual('AB');
        });

        it('FAIL - bad regex postcode', async () => {
            const result = L.query('policy.address.postcode.regex(~~~~)');
            expect(result).toEqual('');
        });

        it('FAIL - property not a string', async () => {
            try {
                const result = L.query('proposer.children.regex(^[A-Za-z]{2}|^[A-Za-z]{1})');
            } catch(e) {
                expect(e.message).toEqual('Type error: in proposer.children.regex(^[A-Za-z]{2}|^[A-Za-z]{1})) the value is not a string');
            }
        });

        it('FAIL - property is an array', async () => {
            try {
                const result = L.query('proposer.claims.regex(^[A-Za-z]{2}|^[A-Za-z]{1})');
            } catch(e) {
                expect(e.message).toEqual('Type error: in proposer.claims.regex(^[A-Za-z]{2}|^[A-Za-z]{1})) the value is not a string');
            }
        });

    });
    
    describe('Array first', () => {
        it('PASS - map', async () => {
            const result = L.query('additional_drivers.map(claims).map(code)');
            expect(result).toEqual(['W'])
        });

        it('PASS - count', async () => {
            const result = L.query('additional_drivers.map(claims).count()');
            expect(result).toEqual(1);
        });

        it('PASS - sum', async () => {
            const result = L.query('additional_drivers.map(convictions).sum(points)');
            expect(result).toEqual(7);
        });

        it('PASS - mean', async () => {
            const result = L.query('additional_drivers.map(convictions).map(points).mean()');
            expect(result).toEqual(7);
        });

        it('PASS - filter (string not quotes) =', async () => {
            const result = L.query('additional_drivers.map(claims).filter(code=W).map(code)');
            expect(result).toEqual(['W'])
        });

        it('PASS - filter (string " quotes) =', async () => {
            const result = L.query('additional_drivers.map(claims).filter(code="W").map(code)');
            expect(result).toEqual(['W'])
        });

        it(`PASS - filter filter (string ' quotes) =`, async () => {
            const result = L.query(`additional_drivers.map(claims).filter(code='W').map(code)`);
            expect(result).toEqual(['W'])
        });

        it('PASS - filter = boolean', async () => {
            const result = L.query('additional_drivers.filter(medical_informed_dvla=true).count()');
            expect(result).toEqual(1)
        });

        it('PASS - filter = boolean', async () => {
            const result = L.query('additional_drivers.filter(medical_informed_dvla=false).count()');
            expect(result).toEqual(1)
        });

        it('PASS - unique =', async () => {
            const result = L.query('additional_drivers.map(convictions).unique(code).count()');
            expect(result).toEqual(1);
        });

        it('PASS - max for [] is 0 with no default', async () => {
            const result = L.query('additional_drivers.filter(title=MRS).map(ncd).max()');
            expect(result).toEqual(0);
        });

        it('PASS - max for [] is 5 with default', async () => {
            const result = L.query('additional_drivers.filter(title="MRS").map(ncd).max(5)');
            expect(result).toEqual(5);
        });

        it('PASS - min for [] is 5 with default', async () => {
            const result = L.query(`additional_drivers.filter(title='MRS').map(ncd).min(5)`);
            expect(result).toEqual(5);
        });

        it('PASS - mean for [] is 5 with default', async () => {
            const result = L.query('additional_drivers.filter(title=MRS).map(ncd).mean(5)');
            expect(result).toEqual(5);
        });

        it('PASS - default is 5 if undefined', async () => {
            const result = L.query('proposer.unknown.default(5)');
            expect(result).toEqual(5);
        });

        it('PASS - default is "str" if undefined', async () => {
            const result = L.query('proposer.unknown.default(str)');
            expect(result).toEqual('str');
        });

        it('PASS - default is "str" if undefined', async () => {
            const result = L.query('proposer.unknown.default("str")');
            expect(result).toEqual('str');
        });

        it('PASS - default is ignored if defined', async () => {
            const result = L.query('proposer.ncd.default(-1)');
            expect(result).toEqual(5);
        });

        it('PASS - default works if result is 0 with min', async () => {
            const result = L.query('additional_drivers.map(children).min(99)');
            expect(result).toEqual(0);
        });

        it('PASS - default works if result is 0 with max', async () => {
            const result = L.query('additional_drivers.map(children).max(99)');
            expect(result).toEqual(0);
        });

        it('PASS - default works if result is 0 with default', async () => {
            const result = L.query('proposer.children.default(99)');
            expect(result).toEqual(0);
        });

        it('PASS - age MM with top-level date pointer', async () => {
            const result = L.query('proposer.convictions.map(date).age(MM, created_at)');
            expect(result).toEqual([ 53, 24, 17]);
        });

        it('PASS - date MM', async () => {
            const result = L.query('proposer.convictions.map(date).date(MM)');
            expect(result).toEqual([ 7, 12, 7]);
        });
        
    });

    describe('Evaluate Multiple Querys', () => {
        it('PASS - max([query1, query2])', async () => {
            const result = L.query('max([additional_drivers.map(ncd).max(), proposer.ncd])');
            expect(result).toEqual(16);
        });

        it('PASS - min([query1, 10])', async () => {
            const result = L.query('max([10, proposer.ncd])');
            expect(result).toEqual(10);
        });

        it('PASS - min([query1, query2])', async () => {
            const result = L.query('min([additional_drivers.map(ncd).max(), proposer.ncd])');
            expect(result).toEqual(5);
        });

        it('PASS - min([query1, 10])', async () => {
            const result = L.query('min([10, proposer.ncd])');
            expect(result).toEqual(5);
        });

        it('PASS - range(query1.max(), query2])', async () => {
            const result = L.query('range([additional_drivers.map(licence_year).max(), proposer.licence_year])');
            expect(result).toEqual(13);
        });

        it('PASS - range([query1.min(), query2])', async () => {
            const result = L.query('range([additional_drivers.map(licence_year).min(), proposer.licence_year])');
            expect(result).toEqual(16);
        });

        it('PASS - each.additional_drivers.map(claims).count()', async () => {
            const result = L.query('each.additional_drivers.map(claims).count()');
            expect(result).toEqual([1, 0]);
        });

        it('PASS - additional_drivers.map(claims).count()', async () => {
            const result = L.query('additional_drivers.map(claims).count()');
            expect(result).toEqual(1);
        });

        it('PASS - each.additional_drivers.map(claims).filter(code=W).map(code)', async () => {
            const result = L.query('each.additional_drivers.map(claims).filter(code=W).map(code)');
            expect(result).toEqual([['W'], []]);
        });

        it('PASS - additional_drivers.map(claims).filter(code=W).map(code)', async () => {
            const result = L.query('additional_drivers.map(claims).filter(code=W).map(code)');
            expect(result).toEqual(['W']);
        });
    });

    describe('Load Test - Small 1 Quote (2.5KB) - 10000 executions in ms', () => {
        it('get object', async () => {
            const L = new Oneliner(quote);
            const start = performance.now();
            times(10000, () => {
                L.query('proposer.ncd');
                L.query('policy.address.postcode');
                L.query('vehicle.rating');
            });
            const end = performance.now();
            expect(end - start).toBeLessThan(500);
        });
        it('filter, sum, map', async () => {
            const L = new Oneliner(quote);
            const start = performance.now();
            times(10000, () => {
                L.query('additional_drivers.map(claims)');
                L.query('additional_drivers.map(claims).filter(code=W)');
                L.query('additional_drivers.map(convictions).sum(points)');
            });
            const end = performance.now();
            expect(end - start).toBeLessThan(500);
        });
    });

    describe('Load Test - Big 1000 Quotes (2.5MB) - 100 executions in ms', () => {
        it('get object', async () => {
            const L = new Oneliner(bigQuote);
            const start = performance.now();
            times(1000, () => {
                L.query(`quote_${random(1, 999)}.proposer.ncd`);
                L.query(`quote_${random(1, 999)}.policy.address.postcode`);
                L.query(`quote_${random(1, 999)}.vehicle.rating`);
            });
            const end = performance.now();
            expect(end - start).toBeLessThan(5000);
        });
        it('filter, sum, map', async () => {
            const L = new Oneliner(bigQuote);
            const start = performance.now();
            times(1000, () => {
                L.query(`quote_${random(1, 999)}.additional_drivers.map(claims)`);
                L.query(`quote_${random(1, 999)}.additional_drivers.map(claims).filter(code=W)`);
                L.query(`quote_${random(1, 999)}.additional_drivers.map(convictions).sum(points)`);
            });
            const end = performance.now();
            expect(end - start).toBeLessThan(5000);
        });
    });
    
});
