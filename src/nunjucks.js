import nunjucks from 'nunjucks';
import moment from 'moment';

const markdown = nunjucks.configure("assets/md", {
    autoescape: false
}).addFilter('excerpt', function(input, length) {
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
}).addFilter('date', function(date, format) {
    let result, args = [], obj;

    args.push(arguments);

    obj = moment.utc(date).local();

    if (obj) {
        if (obj[format] && nlib.isFunction(obj[format])) {
            result = obj[format].apply(obj, args.slice(2));
        } else {
            result = obj.format(format);
        }
    }

    return result;
});

module.exports = markdown;