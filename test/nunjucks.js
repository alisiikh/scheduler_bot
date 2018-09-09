const mdTmplEngine = require('../src/nunjucks').md;
const assert = require('chai').assert;
const expect = require('chai').expect;

describe('Nunjucks tests', () => {
    describe('Tests for custom filters', () => {
        it('Filter excerpt should work correctly on string input', (done) => {
            const tmpl = '{{ content | excerpt(10) }}';

            assert.equal(mdTmplEngine.renderString(tmpl, { content: 'Content which should be shortened' }), 'Content wh...');
            assert.equal(mdTmplEngine.renderString(tmpl, { content: 'Cont' }), 'Cont');
            assert.equal(mdTmplEngine.renderString(tmpl, { content: '' }), '');

            done();
        });

        it('Negative excerpt parameter should throw an exception', (done) => {
            const tmpl = '{{ content | excerpt(-1) }}';

            expect(() => mdTmplEngine.renderString(tmpl, { content: 'content' })).to.throw("Filter 'excerpt' parameter should be more than zero");

            done();
        });

        it('Variable content of non-string type is not supported', (done) => {
            const tmpl = '{{ content | excerpt(10) }}';

            expect(() => mdTmplEngine.renderString(tmpl, { content: 5 })).to.throw("Filter 'excerpt' only supports String variable as an input");
            expect(() => mdTmplEngine.renderString(tmpl, { content: NaN })).to.throw("Filter 'excerpt' only supports String variable as an input");
            expect(() => mdTmplEngine.renderString(tmpl, { content: [] })).to.throw("Filter 'excerpt' only supports String variable as an input");
            expect(() => mdTmplEngine.renderString(tmpl, { content: {} })).to.throw("Filter 'excerpt' only supports String variable as an input");
            done();
        });
    });
});