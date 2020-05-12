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
        let field;
        switch (this.item.type) {
        case "radio":
            field = this.getEl(`${this.item.id}_0`);
            break;
        default:
            field = this.getEl(this.item.id);
        }
        if (field) {
            field.focus();
        }
    }

    onFieldValueChange(e) {
        this.emit("value-change", {
            type: "input",
            id: e.target.dataset.id,
            value: e.target.value
        });
    }

    onArrInputChange(e) {
        this.emit("value-change", {
            type: "arr",
            id: e.target.dataset.id,
            inputid: e.target.dataset.inputid,
            value: e.target.checked
        });
    }

    onBooleanInputChange(e) {
        this.emit("value-change", {
            type: "boolean",
            id: e.target.dataset.id,
            value: !!e.target.checked
        });
    }

    onFileInputChange(e) {
        this.emit("value-change", {
            id: e.target.dataset.id,
            type: "file",
            value: Array.from(e.target.files).map((file, index) => {
                const fileData = e.target.files[index];
                const uid = uuidv4();
                fileData.zuid = uid;
                return {
                    type: "file",
                    name: file.name,
                    id: uid,
                    data: e.target.files[index],
                };
            })
        });
    }

    onFileRemove(e) {
        this.emit("remove-arr-item", {
            id: e.target.dataset.id,
            itemid: e.target.dataset.itemid
        });
    }

    onButtonClick(e) {
        this.emit("button-click", {
            id: e.target.dataset.id
        });
    }
};
