/* eslint-disable arrow-body-style */
module.exports = class {
    onCreate() {
        this.state = {
            processValue: null
        };
    }

    onMount() {
        // eslint-disable-next-line no-unused-vars
        this.state.processValue = (id, value, column, row) => {
            return value;
        };
    }

    // eslint-disable-next-line class-methods-use-this
    onActionClick(data) {
        console.log(data);
    }

    // eslint-disable-next-line class-methods-use-this
    onTopButtonClick(data) {
        console.log(data);
    }
};
