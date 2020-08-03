module.exports = class {
    onCreate() {
        const state = {
            active: false,
            filenameSrc: "",
            filenameDest: "",
            title: "",
            mode: "",
            error: null
        };
        this.state = state;
        this.func = {
            setActive: this.setActive.bind(this),
            setFilename: this.setFilename.bind(this),
            setTitle: this.setTitle.bind(this),
            setMode: this.setMode.bind(this),
        };
    }

    setActive(active) {
        this.setState({
            active,
            error: false
        });
        if (active) {
            setTimeout(() => this.getEl("z3_ap_f_inputModal_filename").focus(), 10);
        }
    }

    setFilename(filenameDest = "") {
        this.setState({
            filenameDest,
            filenameSrc: filenameDest
        });
    }

    setTitle(title = "") {
        this.setState({
            title
        });
    }

    setMode(mode = "") {
        this.setState({
            mode
        });
    }

    onCloseClick() {
        this.setActive(false);
    }

    checkForErrors() {
        const dest = this.state.filenameDest.trim();
        if (!dest || !dest.length) {
            this.setState("error", true);
            return false;
        }
        return dest;
    }

    onFormSubmit(e) {
        e.preventDefault();
        this.onConfirmClick(e);
    }

    onConfirmClick(e) {
        e.preventDefault();
        const dest = this.checkForErrors();
        if (!dest) {
            return;
        }
        this.emit("input-confirm", {
            mode: this.state.mode,
            dest,
            src: this.state.filenameSrc.trim()
        });
        this.setActive(false);
    }

    onFilenameChange(e) {
        this.state.filenameDest = e.target.value;
    }
};
