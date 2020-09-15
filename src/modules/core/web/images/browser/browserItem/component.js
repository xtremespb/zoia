module.exports = class {
    onDoubleClick(e) {
        if (this.input.file.dir) {
            e.preventDefault();
            this.emit("chdir", {
                file: this.input.file
            });
        }
    }
};
