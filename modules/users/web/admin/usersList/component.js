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

    onTopButtonClick(data) {
        switch (data.button) {
        case "btnReload":
            this.getComponent("usersTable").func.dataRequest();
            break;
        case "btnAdd":
            window.router.navigate("users.edit", {
                id: "new"
            });
            break;
        }
    }
};
