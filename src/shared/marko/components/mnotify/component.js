const cloneDeep = require("lodash.clonedeep");
const {
    v4: uuidv4
} = require("uuid");

module.exports = class {
    onCreate() {
        const state = {
            notificationQueue: []
        };
        this.state = state;
        this.queueProcessInterval = 100;
        this.func = {
            show: this.show.bind(this),
            clean: this.clean.bind(this),
        };
    }

    positionQueueItems() {
        this.state.notificationQueue.map((q, i) => {
            const item = document.getElementById(q.id);
            if (item) {
                item.style.top = `${12 + (i * 70)}px`;
            }
        });
    }

    processNotificationQueue() {
        if (this._processingQueue) {
            return;
        }
        this._processingQueue = true;
        this.state.notificationQueue.map(q => {
            if (!q.visible) {
                const div = document.createElement("div");
                div.innerHTML = q.message;
                div.classList.add("notification");
                div.classList.add("z3-notification");
                if (q.css) {
                    div.classList.add(q.css);
                }
                div.id = q.id;
                document.body.append(div);
                q.visible = true;
            }
            q.delay -= this.queueProcessInterval;
        });
        let notificationQueue = cloneDeep(this.state.notificationQueue);
        const removeFromQueue = this.state.notificationQueue.filter(i => i.delay <= 0);
        removeFromQueue.map(i => {
            notificationQueue = notificationQueue.filter(f => f.id !== i.id);
            const item = document.getElementById(i.id);
            if (item) {
                item.remove();
            }
        });
        this.setState("notificationQueue", notificationQueue);
        this.positionQueueItems();
        this._processingQueue = false;
    }

    initNotificationQueueProcessor() {
        this.notificationQueueProcessor = setInterval(() => this.processNotificationQueue(), this.queueProcessInterval);
    }

    onMount() {
        this.initNotificationQueueProcessor();
    }

    clean() {
        this._processingQueue = true;
        this.state.notificationQueue.map(q => {
            if (q.visible) {
                q.visible = false;
                const item = document.getElementById(q.id);
                if (item) {
                    item.remove();
                }
            }
        });
        this.setState("notificationQueue", []);
        this._processingQueue = false;
    }

    onDestroy() {
        if (this.notificationQueueProcessor) {
            clearInterval(this.notificationQueueProcessor);
            this.clean();
        }
    }

    show(message, css = "", delay = 3500) {
        const queue = cloneDeep(this.state.notificationQueue);
        queue.push({
            id: uuidv4(),
            message,
            css,
            delay,
        });
        this.setState("notificationQueue", queue);
    }
};
