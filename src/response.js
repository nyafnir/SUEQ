class Response {
    constructor(userMessage, devMessage = null, data = null) {
        this.userMessage = userMessage;
        this.devMessage = devMessage || userMessage;
        this.data = data;
    }
    Response() {
        return {
            userMessage: this.userMessage,
            devMessage: this.devMessage,
            data: this.data,
        };
    }
}

module.exports = Response;
