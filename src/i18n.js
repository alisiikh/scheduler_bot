'use strict';

const i18n = require('i18n');

i18n.configure({
    locales: ['en', 'ua', 'ru'],
    defaultLocale: 'en',
    register: global,
    directory: __dirname + "/locales",

    // setting of log level DEBUG - default to require('debug')('i18n:debug')
    logDebugFn: function (msg) {
        console.log('debug', msg);
    },

    // setting of log level WARN - default to require('debug')('i18n:warn')
    logWarnFn: function (msg) {
        console.log('warn', msg);
    },

    // setting of log level ERROR - default to require('debug')('i18n:error')
    logErrorFn: function (msg) {
        console.log('error', msg);
    }
});

module.exports = i18n;