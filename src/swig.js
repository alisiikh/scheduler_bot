const swig = require('swig');

swig.setDefaultTZOffset(180); // CDT

swig.setFilter('excerpt', function (input, length) {
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

module.exports = swig;