/* eslint-disable no-console */

//
//
// Patch zoia.json
//
//

import colors from "colors/safe";
import fs from "fs-extra";
import path from "path";

let isPatched = false;

const convert = (node, k, value) => {
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
};

const traverse = (node, key, value, currentPath = []) => {
    const pathData = currentPath;
    Object.keys(node).map(k => {
        if (node[k] && typeof node[k] === "object" && !Array.isArray(node[k])) {
            pathData.push(k);
            traverse(node[k], key, value, pathData);
            pathData.pop();
        } else {
            const id = `${currentPath.join("_")}${currentPath.length ? "_" : ""}${k}`.replace(/-/gm, "_").toUpperCase();
            if (key === id) {
                node[k] = convert(node, k, value);
                isPatched = true;
            }
            if (key === `${id}_PUSH` && Array.isArray(node[k])) {
                node[k].push(value);
                isPatched = true;
            }
        }
    });
};

export default async (config, options) => {
    console.log(`\n${colors.cyan(" Operation:")} patch configuration file`);
    const configSystem = fs.readJSONSync(path.resolve(`${__dirname}/../../etc/system.json`));
    const configZoia = fs.readJSONSync(path.resolve(`${__dirname}/../../etc/zoia.json`));
    if (!options.patch || options.patch.split(/=/).length !== 2) {
        console.error(`${colors.red(" Error:")} missing or invalid parameters`);
        return;
    }
    const [key, value] = options.patch.split(/=/);
    traverse(configSystem, key, value);
    traverse(configZoia, key, value);
    if (!isPatched) {
        console.error(`${colors.red(" Error:")} ${colors.white("could not patch configuration file")}`);
        return;
    }
    fs.writeJSONSync(path.resolve(`${__dirname}/../../etc/system.json`), configSystem, {
        spaces: 4
    });
    fs.writeJSONSync(path.resolve(`${__dirname}/../../etc/zoia.json`), configZoia, {
        spaces: 4
    });
    console.log(`${colors.green(" Success:")} ${colors.white(`configuration file was patched`)}`);
};
