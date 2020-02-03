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
            const result = L.query('proposer.convictions.mean(points)');
            expect(result).toEqual(3.67);
        });

        it('PASS - filter =', async () => {
            const result = L.query('proposer.claims.filter(code=A).map(code)');
            expect(result).toEqual(['A'])
        });

        it('PASS - unique =', async () => {
            const result = L.query('proposer.convictions.unique(code).count()');
            expect(result).toEqual(1);
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
            const result = L.query('additional_drivers.map(convictions).mean(points)');
            expect(result).toEqual(7);
        });

        it('PASS - filter =', async () => {
            const result = L.query('additional_drivers.map(claims).filter(code=W).map(code)');
            expect(result).toEqual(['W'])
        });

        it('PASS - filter =', async () => {
            const result = L.query('additional_drivers.filter(medical_informed_dvla=true).count()');
            expect(result).toEqual(1)
        });

        it('PASS - unique =', async () => {
            const result = L.query('additional_drivers.map(convictions).unique(code).count()');
            expect(result).toEqual(1);
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
