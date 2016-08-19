const os = require('os');

String.prototype.replaceAll = (search, replacement) => {
    const target = this;
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
        // TODO: this is super weird and markdown doesn't work fine in Skype :(
        return `${os.EOL}${os.EOL}`;
    }
}

module.exports = MDUtil;