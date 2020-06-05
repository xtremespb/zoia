module.exports = class {
    onCreate() {
        const state = {
            lightboxActive: false,
        };
        this.state = state;
    }

    onLightboxImageClick(e) {
        e.preventDefault();
        this.state.lightboxActive = true;
    }

    onLightboxClose() {
        this.state.lightboxActive = false;
    }

};
