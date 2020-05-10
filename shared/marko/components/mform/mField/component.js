const {
    v4: uuidv4
} = require("uuid");

module.exports = class {
    onCreate(input) {
        this.item = input.item;
        this.func = {
            setFocus: this.setFocus.bind(this)
        };
    }

    setFocus() {
        const field = this.getEl(this.item.id);
        console.log(field);
        if (field) {
            field.focus();
        }
    }

    onFieldValueChange(e) {
        const {
            id
        } = e.target.dataset;
        const {
            value
        } = e.target;
        this.emit("value-change", {
            id,
            type: "input",
            value
        });
    }

    async onFileInputChange(e) {
        const {
            id
        } = e.target.dataset;
        const {
            files
        } = e.target;
        this.emit("value-change", {
            id,
            type: "file",
            value: await Promise.all(Array.from(files).map(async (file, index) => {
                const fileData = files[index];
                const uid = uuidv4();
                fileData.zuid = uid;
                return {
                    name: file.name,
                    id: uid,
                    data: files[index],
                    type: "file",
                };
            }))
        });
    }

    onFileRemove(e) {
        const {
            id,
            itemid
        } = e.target.dataset;
        this.emit("remove-arr-item", {
            id,
            itemid
        });
    }
};
