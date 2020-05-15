module.exports = class {
    onMount() {
        if (this.input.id !== "new") {
            this.getComponent("userEditForm").loadData();
        }
    }

    onFormPostSuccess() {
        window.router.navigate("users");
    }

    onButtonClick(obj) {
        switch (obj.id) {
        case "btnCancel":
            window.router.navigate("users");
        }
    }
};
