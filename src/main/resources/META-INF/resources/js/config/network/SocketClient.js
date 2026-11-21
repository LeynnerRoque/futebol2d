export class SocketClient {
    constructor(url = null) {
        this.url = url;
        this.socket = null;
    }

    connect() {
        if (!this.url) return;
        this.socket = new WebSocket(this.url);
    }

    sendEvent(type, payload = {}) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type, payload }));
        }
    }
}