module.exports = class {
    onCreate() {
        const state = {
            product: 0
        };
        this.state = state;
    }

    onProductClick(e) {
        this.state.product = parseInt(e.target.dataset.id, 10);
    }
};
