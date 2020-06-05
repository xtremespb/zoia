module.exports = class {
    onCreate(input, out) {
        const state = {
            lightboxActive: false,
            lightboxIndex: 0,
            lightboxImages: out.global.yacht.images,
            carouselControls: false
        };
        this.state = state;
    }

    onMount() {
        this.carousel = document.getElementById("bmCarousel");
        window.addEventListener("resize", this.setCarouselControlsActive.bind(this));
        this.setCarouselControlsActive();
        window.addEventListener("keydown", e => {
            if (!this.state.lightboxActive) {
                return;
            }
            switch (e.key) {
            case "ArrowLeft":
                this.onLightboxPrev();
                break;
            case "ArrowRight":
                this.onLightboxNext();
                break;
            case "Escape":
                this.onLightboxClose();
                break;
            }
        });
    }

    setCarouselControlsActive() {
        this.state.carouselControls = this.carousel.scrollWidth > this.carousel.offsetWidth;
    }

    onLightboxImageClick(e) {
        e.preventDefault();
        const {
            index
        } = e.target.dataset;
        this.state.lightboxIndex = index;
        this.state.lightboxActive = true;
    }

    onLightboxClose() {
        this.state.lightboxActive = false;
    }

    onCarouselRight() {
        if (this.carousel.scrollWidth >= this.carousel.scrollLeft + 107) {
            this.carousel.scrollLeft += 107;
        }
    }

    onCarouselLeft() {
        if (this.carousel.scrollWidth >= 107) {
            this.carousel.scrollLeft -= 107;
        }
    }

    onLightboxPrev() {
        let index = parseInt(this.state.lightboxIndex, 10);
        if (index > 0) {
            index -= 1;
        } else {
            index = this.state.lightboxImages.length - 1;
        }
        this.state.lightboxIndex = index;
    }

    onLightboxNext() {
        let index = parseInt(this.state.lightboxIndex, 10);
        if (index < this.state.lightboxImages.length - 1) {
            index += 1;
        } else {
            index = 0;
        }
        this.state.lightboxIndex = index;
    }
};
