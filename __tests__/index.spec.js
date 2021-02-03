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

        it('PASS - unique =', async () => {
            const result = L.query('additional_drivers.map(convictions).unique(code).count()');
            expect(result).toEqual(1);
        });

        it('PASS - max for [] is 0 with no default', async () => {
            const result = L.query('additional_drivers.filter(title=MRS).map(ncd).max()');
            expect(result).toEqual(0);
        });

        it('PASS - max for [] is 5 with no default', async () => {
            const result = L.query('additional_drivers.filter(title="MRS").map(ncd).max(5)');
            expect(result).toEqual(5);
        });

        it('PASS - min for [] is 5 with no default', async () => {
            const result = L.query(`additional_drivers.filter(title='MRS').map(ncd).min(5)`);
            expect(result).toEqual(5);
        });

        it('PASS - mean for [] is 5 with no default', async () => {
            const result = L.query('additional_drivers.filter(title=MRS).map(ncd).mean(5)');
            expect(result).toEqual(5);
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
    });

    describe('Load Test - Small 1 Quote (2.5KB) - 10000 executions in ms', () => {
        it('get object', async () => {
            const start = performance.now();
            const L = new Oneliner(quote);
            times(10000, () => {
                L.query('proposer.ncd');
                L.query('policy.address.postcode');
                L.query('vehicle.rating');
            });
            const end = performance.now();
            expect(end - start).toBeLessThan(250);
        });
        it('filter, sum, map', async () => {
            const start = performance.now();
            const L = new Oneliner(quote);
            times(10000, () => {
                L.query('additional_drivers.map(claims)');
                L.query('additional_drivers.map(claims).filter(code=W)');
                L.query('additional_drivers.map(convictions).sum(points)');
            });
            const end = performance.now();
            expect(end - start).toBeLessThan(250);
        });
    });

    describe('Load Test - Big 1000 Quotes (2.5MB) - 100 executions in ms', () => {
        it('get object', async () => {
            const start = performance.now();
            const L = new Oneliner(bigQuote);
            times(1000, () => {
                L.query(`quote_${random(1, 999)}.proposer.ncd`);
                L.query(`quote_${random(1, 999)}.policy.address.postcode`);
                L.query(`quote_${random(1, 999)}.vehicle.rating`);
            });
            const end = performance.now();
            expect(end - start).toBeLessThan(1500);
        });
        it('filter, sum, map', async () => {
            const start = performance.now();
            const L = new Oneliner(bigQuote);
            times(1000, () => {
                L.query(`quote_${random(1, 999)}.additional_drivers.map(claims)`);
                L.query(`quote_${random(1, 999)}.additional_drivers.map(claims).filter(code=W)`);
                L.query(`quote_${random(1, 999)}.additional_drivers.map(convictions).sum(points)`);
            });
            const end = performance.now();
            expect(end - start).toBeLessThan(1500);
        });
    });
    
});
