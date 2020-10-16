module.exports = class {
    onCreate() {
        const state = {
            uid: null,
            positionLeft: "0px",
            positionTop: "0px",
            active: false,
        };
        this.state = state;
        this.func = {
            setActive: this.setActive.bind(this),
        };
    }

    setActive(active, positionLeft = 0, positionTop = 0, uid = null) {
        if (!active) {
            this.setState({
                active,
            });
            return;
        }
        this.setState({
            active,
            positionLeft: `${positionLeft}px`,
            positionTop: `-999999px`,
            uid,
        });
        setTimeout(() => {
            const h = document.getElementById("z3_mf_images_menu").offsetHeight;
            this.setState({
                positionTop: `${positionTop - h}px`,
            });
        }, 1);
    }

    processMenuItemClick(e) {
        e.preventDefault();
        const dataset = Object.keys(e.target.dataset).length ? e.target.dataset : Object.keys(e.target.parentNode.dataset).length ? e.target.parentNode.dataset : Object.keys(e.target.parentNode.parentNode.dataset).length ? e.target.parentNode.parentNode.dataset : {};
        this.state.active = false;
        return {
            uid: dataset.uid,
            cmd: dataset.cmd
        };
    }

    onItemClick(e) {
        const {
            uid,
            cmd
        } = this.processMenuItemClick(e);
        this.emit("item-click", {
            uid,
            cmd
        });
    }
};
