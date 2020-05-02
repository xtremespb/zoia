module.exports = class {
    onCreate() {
        this.state = {
            activeBurger: false,
            activeUserMenu: false,
            activeLangMenu: false,
            activeNavbarMenu: false
        };
    }

    onMount() {
        document.addEventListener("click", e => {
            if (e.target.id !== "za_ap_username_dropdown") {
                this.setState("activeUserMenu", false);
            }
            if (e.target.id !== "za_ap_lang_dropdown") {
                this.setState("activeLangMenu", false);
            }
        });
    }

    onBurgerClick() {
        this.setState("activeBurger", !this.state.activeBurger);
        this.setState("activeNavbarMenu", !this.state.activeNavbarMenu);
    }

    onUserMenuClick() {
        this.setState("activeUserMenu", !this.state.activeUserMenu);
    }

    onLangMenuClick() {
        this.setState("activeLangMenu", !this.state.activeLangMenu);
    }
};
