module.exports = class {
    onCreate(input, out) {
        this.holdingData = out.global.userHoldingData;
        this.i18n = out.global.i18n;
    }

    onMount() {
        this.generateModal = this.getComponent("z3_cm_generateModal");
        this.certModal = this.getComponent("z3_cm_certModal");
        this.cardForm = this.getComponent("z3_cm_cardForm");
    }

    onFormSubmit(dataForm) {
        const errors = [];
        let fatal = false;
        const data = dataForm.__default;
        const priceMin = this.holdingData.cards[data.cardType - 1].priceMin || 0;
        const priceMax = this.holdingData.cards[data.cardType - 1].priceMax || 0;
        const dateArr = data.date.split(/\./);
        const dateTimestamp = parseInt(new Date(dateArr[2], dateArr[1] - 1, dateArr[0]).getTime() / 1000, 10);
        const currentTimestamp = parseInt(new Date().getTime() / 1000, 10);
        const allowedOffset = 5259492; // 2 months in seconds
        if (data.price && data.price !== 0) {
            if (priceMin && data.price < priceMin) {
                errors.push(this.i18n.t("priceMinConstraints"));
            }
            if (priceMax && data.price > priceMax) {
                errors.push(this.i18n.t("priceMaxConstraints"));
            }
        }
        if ((currentTimestamp > dateTimestamp && currentTimestamp - dateTimestamp > allowedOffset) || (currentTimestamp < dateTimestamp && dateTimestamp - currentTimestamp > allowedOffset)) {
            errors.push(this.i18n.t("timeConstraints"));
            fatal = true;
        }
        if (errors.length) {
            this.generateModal.func.setActive(true, errors, fatal);
            return;
        }
        this.cardForm.func.submitForm(true);
    }

    onConfirmClick() {
        this.cardForm.func.submitForm(true);
    }

    onButtonClick(data) {
        switch (data.id) {
        case "btnReset":
            this.cardForm.func.resetData();
            setTimeout(() => this.cardForm.func.autoFocus(), 1);
            break;
        }
    }

    onFormPostSuccess(result) {
        this.certModal.func.setActive(true, result.data.uid);
    }
};
