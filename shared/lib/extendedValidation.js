import Ajv from "ajv";

export default class {
    constructor(body, root, part, parts = []) {
        this.body = body;
        this.ajv = new Ajv();
        this.schemas = {
            root,
            part
        };
        this.parts = parts;
    }

    validate() {
        try {
            const formData = JSON.parse(this.body.__form);
            let errors = [];
            if (this.schemas.part) {
                this.parts.map(part => {
                    console.log(part);
                    console.log(formData[part]);
                    const valid = this.ajv.validate(this.schemas.part, formData[part]);
                    console.log(valid);
                    if (!valid) {
                        errors = [...errors, ...this.ajv.errors.map(e => ({
                            ...e,
                            part
                        }))];
                    }
                    delete formData[part];
                });
            }
            if (this.schemas.root) {
                const valid = this.ajv.validate(this.schemas.root, formData);
                if (!valid) {
                    errors = [...errors, ...this.ajv.errors];
                }
            }
            return {
                failed: errors.length > 0,
                error: errors.length > 0 ? "Validation error" : "",
                errorData: errors
            };
        } catch (e) {
            return {
                failed: true,
                error: e.message,
                errorData: []
            };
        }
    }
}
