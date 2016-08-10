
class MDUtil {
    static adaptToMarkdown(content) {
        if (content.indexOf("\r\n") != -1) {
            return content.replace("\r\n", "\n\n");
        } else if (content.indexOf("\r\n") != - 1) {
            return content.replace("\n", "\n\n");
        }
    }
}

module.exports = MDUtil;