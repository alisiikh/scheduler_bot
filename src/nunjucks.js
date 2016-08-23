const nunjucks = require('nunjucks');
const fs = require('fs');
const dateFilter = require('nunjucks-date-filter');

var env = nunjucks.configure("template", {
    autoescape: false
});

env.addFilter('excerpt', function(input, length) {
    if (typeof input !== 'string') {
        throw new Error("Filter 'excerpt' only supports String variable as an input");
    }

    if (length < 0) {
        throw new Error("Filter 'excerpt' parameter should be more than zero");
    }

    if (input.length > length) {
        return input.substring(0, length) + "...";
    } else {
        return input;
    }
});

env.addFilter('date', dateFilter);

module.exports = env;