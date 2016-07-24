const swig = require('swig');

swig.setFilter('excerpt', function (input, length) {
    if (typeof input !== 'string') {
        throw new Error("Filter 'excerpt' only supports String variable as an input");
    }

    if (input.length > length) {
        return input.substring(0, length) + "...";
    } else {
        return input;
    }
});

module.exports = swig;