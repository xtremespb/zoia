const axios = require("axios");
const cloneDeep = require("lodash.clonedeep");
const Cookies = require("../../../../../shared/lib/cookies").default;

module.exports = class {
    onCreate(input, out) {
        const state = {
            currentQuestionIndex: 0,
            currentQuestionData: null,
            currentAnswers: [],
            sessionData: out.global.sessionData,
            loading: false
        };
        this.state = state;
        this.cookieOptions = out.global.cookieOptions;
        this.siteOptions = out.global.siteOptions;
        this.i18n = out.global.i18n;
        this.programId = out.global.programId;
        this.moduleData = out.global.moduleData;
        this.testId = out.global.testId;
    }

    onMount() {
        const cookies = new Cookies(this.cookieOptions);
        this.token = cookies.get(`${this.siteOptions.id || "zoia3"}.authToken`);
        this.loadQuestion(this.state.sessionData.questions[this.state.currentQuestionIndex].id);
    }

    async loadQuestion(id) {
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
            this.setState("currentQuestionData", res.data);
        } catch (e) {
            this.state.loading = false;
            console.log(e);
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
        this.setState("currentAnswers", [e.target.dataset.id]);
    }

    async onPrevQuestionClick() {
        const currentQuestionIndex = this.state.currentQuestionIndex - 1;
        this.setState("currentQuestionIndex", currentQuestionIndex);
        this.setState("currentAnswers", []);
        await this.loadQuestion(this.state.sessionData.questions[currentQuestionIndex].id);
    }

    async onNextQuestionClick() {
        const currentQuestionIndex = this.state.currentQuestionIndex + 1;
        this.setState("currentQuestionIndex", currentQuestionIndex);
        this.setState("currentAnswers", []);
        await this.loadQuestion(this.state.sessionData.questions[currentQuestionIndex].id);
    }
};
