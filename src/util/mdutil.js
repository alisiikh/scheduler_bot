String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

class MDUtil {
    static convertPlainTextToMarkdown(content) {
        if (content.indexOf("\r\n") != -1) {
            return content.replaceAll("\r\n", "\r\n\r\n");
        } else {
            return content;
        }
    }
}

module.exports = MDUtil;