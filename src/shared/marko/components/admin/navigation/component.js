const throttle = require("lodash.throttle");
const debounce = require("lodash.debounce");

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
        window.addEventListener("scroll", throttle(this.onNavbarToggle.bind(this), 310));
        window.addEventListener("scroll", debounce(this.onSideMenuToggle.bind(this), 50));
        document.addEventListener("click", e => {
            if (e.target.id !== "za_ap_username_dropdown") {
                this.setState("activeUserMenu", false);
            }
            if (e.target.id !== "za_ap_lang_dropdown") {
                this.setState("activeLangMenu", false);
            }
        });
    }

    onNavbarToggle() {
        this.getEl("z3_ap_navbar").style.top = this.scrollPosition < window.pageYOffset && window.pageYOffset > 36 ? "-52px" : "0";
        this.scrollPosition = window.pageYOffset;
    }

    onSideMenuToggle() {
        document.getElementById("z3_ap_side_menu_area").style.display = this.sideMenuBottom > window.pageYOffset ? "block" : "none";
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
