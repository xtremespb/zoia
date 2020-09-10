const axios = require("axios");
const cloneDeep = require("lodash.clonedeep");
const Cookies = require("../../../../../shared/lib/cookies").default;

const DIRECTION_PREV = true;
const DIRECTION_NEXT = false;

module.exports = class {
    onCreate(input, out) {
        const state = {
            currentQuestionIndex: 0,
            currentQuestionData: null,
            currentAnswers: [],
            sessionData: out.global.sessionData,
            loading: false,
            timeOut: false,
            testFinished: false,
            error: null,
            result: out.global.sessionData.result,
            attempts: out.global.sessionData.attempts,
        };
        this.state = state;
        this.cookieOptions = out.global.cookieOptions;
        this.siteOptions = out.global.siteOptions;
        this.i18n = out.global.i18n;
        this.programId = out.global.programId;
        this.moduleData = out.global.moduleData;
        this.testId = out.global.testId;
        this.initQuestion = out.global.sessionData.timeRemain || out.global.sessionData.noTimeLimit;
    }

    onMount() {
        this.confirmModal = this.getComponent("z3_edu_tv_confirmModal");
        const cookies = new Cookies(this.cookieOptions);
        this.token = cookies.get(`${this.siteOptions.id || "zoia3"}.authToken`);
        if (this.initQuestion) {
            this.loadQuestion(this.state.sessionData.questions[this.state.currentQuestionIndex].id);
        }
    }

    async loadQuestion(id) {
        this.state.error = null;
        this.state.loading = true;
        try {
            const res = await axios({
                method: "post",
                url: "/api/edu/questions",
                data: {
                    program: this.programId,
                    module: this.moduleData.id,
                    test: this.testId,
                    id
                },
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.state.loading = false;
            const data = cloneDeep(res.data);
            delete data.userAnswers;
            this.setState("currentQuestionData", data);
            this.setState("currentAnswers", res.data.userAnswers);
        } catch (e) {
            this.state.loading = false;
            this.state.error = this.i18n.t("serverErrorQuestion");
        }
    }

    async saveAnswers(id, answers) {
        this.state.error = null;
        this.state.loading = true;
        try {
            await axios({
                method: "post",
                url: "/api/edu/answers",
                data: {
                    program: this.programId,
                    module: this.moduleData.id,
                    test: this.testId,
                    id,
                    answers
                },
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.state.loading = false;
            return true;
        } catch (e) {
            this.state.loading = false;
            this.state.error = this.i18n.t("serverErrorAnswer");
            return false;
        }
    }

    async finishTest() {
        this.state.error = null;
        this.state.loading = true;
        try {
            const data = await axios({
                method: "post",
                url: "/api/edu/finish",
                data: {
                    program: this.programId,
                    module: this.moduleData.id,
                    test: this.testId,
                },
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.state.loading = false;
            this.setState("result", data.data.result);
            this.setState("attempts", data.data.attempts);
            this.setState("result", data.data.result);
            this.setState("testFinished", true);
        } catch (e) {
            this.state.loading = false;
            this.state.error = this.i18n.t("serverErrorFinish");
        }
    }

    onCheckboxClick(e) {
        const {
            dataset,
            checked
        } = e.target;
        const currentAnswers = cloneDeep(this.state.currentAnswers);
        if (checked && currentAnswers.indexOf(dataset.id) === -1) {
            currentAnswers.push(dataset.id);
        }
        if (!checked && currentAnswers.indexOf(dataset.id) > -1) {
            currentAnswers.splice(currentAnswers.indexOf(dataset.id), 1);
        }
        this.setState("currentAnswers", currentAnswers);
    }

    onRadioClick(e) {
        const dataset = Object.keys(e.target.dataset).length ? e.target.dataset : Object.keys(e.target.parentNode.dataset).length ? e.target.parentNode.dataset : Object.keys(e.target.parentNode.parentNode.dataset).length ? e.target.parentNode.parentNode.dataset : {};
        this.setState("currentAnswers", [dataset.id]);
    }

    async goPrevNext(direction) {
        if (!await this.saveAnswers(this.state.sessionData.questions[this.state.currentQuestionIndex].id, this.state.currentAnswers)) {
            return;
        }
        const currentQuestionIndex = direction === DIRECTION_PREV ? this.state.currentQuestionIndex - 1 : this.state.currentQuestionIndex + 1;
        this.setState("currentQuestionIndex", currentQuestionIndex);
        this.setState("currentAnswers", []);
        await this.loadQuestion(this.state.sessionData.questions[currentQuestionIndex].id);
    }

    onPrevQuestionClick() {
        if (this.state.currentQuestionIndex > 0) {
            this.goPrevNext(DIRECTION_PREV);
        }
    }

    onNextQuestionClick() {
        if (this.state.currentQuestionIndex < this.state.sessionData.questions.length - 1) {
            this.goPrevNext(DIRECTION_NEXT);
        }
    }

    async onFinishClick() {
        this.confirmModal.func.setTitle(this.i18n.t("confirmationTitle"));
        this.confirmModal.func.setMessage(this.i18n.t("testFinishConfirmation"));
        this.confirmModal.func.setURL(null);
        this.confirmModal.func.setActive(true);
    }

    onTimeOut() {
        this.setState("timeOut", true);
    }

    onErrorCloseClick() {
        this.setState("error", null);
    }

    async onConfirmTestFinish() {
        if (!await this.saveAnswers(this.state.sessionData.questions[this.state.currentQuestionIndex].id, this.state.currentAnswers)) {
            return;
        }
        await this.finishTest();
    }

    onResultCloseClick() {
        this.setState("result", null);
    }
};
