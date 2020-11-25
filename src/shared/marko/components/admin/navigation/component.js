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
        if (document.getElementById("z3_ap_demoMessage")) {
            document.getElementById("z3_ap_demoMessage").style.display = this.scrollPosition < window.pageYOffset && window.pageYOffset > 36 ? "none" : "block";
        }
        this.scrollPosition = window.pageYOffset;
    }

    onSideMenuToggle() {
        const sideMenuHeight = parseInt(document.getElementById("z3_ap_side_menu").clientHeight, 10);
        const viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        document.getElementById("z3_ap_side_menu").style.position = viewportHeight > sideMenuHeight && window.pageYOffset > 36 ? "fixed" : "unset";
        document.getElementById("z3_ap_side_menu").style.top = viewportHeight > sideMenuHeight && window.pageYOffset > 36 ? "10px" : "unset";
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
