export default class {
    constructor() {
        const regex = /([^&=]+)=?([^&]*)/g;
        const input = window.location.search || window.location.hash || "";
        const query = input.substring(input.indexOf("?") + 1, input.length);
        this.store = {};
        let match;
        while (match = regex.exec(query)) {
            this.store[decodeURIComponent(match[1])] = decodeURIComponent(match[2]);
        }
    }

    get(id) {
        return this.store[id];
    }
}
