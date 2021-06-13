module.exports = class {
    onCreate() {
        this.state = {
            activeBurger: false,
            activeUserMenu: false,
            activeLangMenu: false,
            activeNavbarMenu: false,
        };
    }

    onMount() {
        this.scrollPosition = window.pageYOffset;
        this.sideMenu = document.getElementById("z3_ap_side_menu");
        this.sideMenuArea = document.getElementById("z3_ap_side_menu_area");
        this.sideMenuTop = this.sideMenu.getBoundingClientRect().top;
        this.sideMenuBottom = this.sideMenu.getBoundingClientRect().bottom;
        window.addEventListener("scroll", this.onSideMenuToggle.bind(this));
        this.onSideMenuToggle();
        document.addEventListener("click", e => {
            if (e.target.id !== "za_ap_username_dropdown") {
                this.setState("activeUserMenu", false);
            }
            if (e.target.id !== "za_ap_lang_dropdown") {
                this.setState("activeLangMenu", false);
            }
        });
    }

    onSideMenuToggle() {
        const sideMenuHeight = parseInt(document.getElementById("z3_ap_side_menu").clientHeight, 10);
        const viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        document.getElementById("z3_ap_side_menu").style.position = viewportHeight > sideMenuHeight ? "fixed" : "unset";
        document.getElementById("z3_ap_side_menu").style.top = viewportHeight > sideMenuHeight ? "63px" : "unset";
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
