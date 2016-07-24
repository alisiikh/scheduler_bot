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

        it('Variable content of non-string type is not supported', (done) => {
            const excerptTestTmpl = swig.compile('{{ content | excerpt(10) }}');

            expect(() => excerptTestTmpl({ content: 5 })).to.throw("Filter 'excerpt' only supports String variable as an input");
            expect(() => excerptTestTmpl({ content: NaN })).to.throw("Filter 'excerpt' only supports String variable as an input");
            expect(() => excerptTestTmpl({ content: [] })).to.throw("Filter 'excerpt' only supports String variable as an input");
            expect(() => excerptTestTmpl({ content: {} })).to.throw("Filter 'excerpt' only supports String variable as an input");
            done();
        });
    });
});