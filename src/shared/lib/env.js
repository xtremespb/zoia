import cloneDeep from "lodash/cloneDeep";

export default class {
    constructor(config) {
        this.config = cloneDeep(config);
    }

    convert(node, k, value) {
        switch (typeof node[k]) {
        case "string":
            return String(value);
        case "boolean":
            return Boolean(value);
        case "number":
            return parseInt(value, 10);
        case "object":
            if (Array.isArray(node[k])) {
                return value.split(",");
            }
            break;
        }
    }

    _traverse(node, currentPath = []) {
        const path = currentPath;
        Object.keys(node).map(k => {
            if (node[k] && typeof node[k] === "object" && !Array.isArray(node[k])) {
                path.push(k);
                this._traverse(node[k], path);
                path.pop();
            } else {
                const id = `${this.config.id}_${currentPath.join("_")}${currentPath.length ? "_" : ""}${k}`.replace(/-/gm, "_").toUpperCase();
                if (process.env[id]) {
                    node[k] = this.convert(node, k, process.env[id]);
                }
                if (process.env[`${id}_PUSH`] && Array.isArray(node[k])) {
                    node[k].push(process.env[`${id}_PUSH`]);
                }
            }
        });
    }

    process() {
        this._traverse(this.config);
        return this.config;
    }
}
