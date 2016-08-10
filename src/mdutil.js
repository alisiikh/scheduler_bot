
class MDUtil {
    static adaptToMarkdown(content) {
        if (content.indexOf("\r\n") != -1) {
            return content.replace("\r\n", "\r\n\r\n");
        } else {
            return content;
        }
    }
}

module.exports = MDUtil;