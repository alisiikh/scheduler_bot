const swig = require('../src/swig');
const assert = require('chai').assert;
const expect = require('chai').expect;

describe('Swig tests', () => {
    describe('Tests for custom swig filters', () => {
        it('Filter excerpt should work correctly on string input', (done) => {
            const excerptTestTmpl = swig.compile('{{ content | excerpt(10) }}');

            assert.equal(excerptTestTmpl({ content: 'Content which should be shortened' }), 'Content wh...');
            assert.equal(excerptTestTmpl({ content: 'Cont' }), 'Cont');
            assert.equal(excerptTestTmpl({ content: '' }), '');

            done();
        });

        it('Negative excerpt parameter should throw an exception', (done) => {
            const excerptTestTmpl = swig.compile('{{ content | excerpt(-1) }}');

            expect(() => excerptTestTmpl({ content: 'content' })).to.throw("Filter 'excerpt' parameter should be more than zero");

            done();
        });
    });
});