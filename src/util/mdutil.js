const os = require('os');

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

class MDUtil {

    static convertPlainTextToMarkdown(content) {
        if (content.indexOf("\r\n") != -1) {
            return content.replaceAll("\r\n", MDUtil.nl());
        } else if (content.indexOf("\n") != -1) {
            return content.replaceAll("\n", MDUtil.nl());
        } else {
            return content;
        }
    }

    static nl() {
        return `  ${os.EOL}`;
    }
}

module.exports = MDUtil;