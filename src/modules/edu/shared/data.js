import path from "path";
import fs from "fs-extra";

const programs = {};
const tests = {};

try {
    const programsDirectory = fs.readJSONSync(path.resolve(`${__dirname}/../../etc/modules/edu/programs.json`));
    if (programsDirectory && Array.isArray(programsDirectory) && programsDirectory.length) {
        programsDirectory.map(p => {
            programs[p] = fs.readJSONSync(path.resolve(`${__dirname}/../../etc/modules/edu/${p}.json`));
            if (programs[p] && programs[p].modules && Array.isArray(programs[p].modules) && programs[p].modules.length) {
                programs[p].modules.map(m => {
                    if (m.tests) {
                        Object.keys(m.tests).map(t => {
                            try {
                                tests[`${p}_${m.id}_${t}`] = fs.readJSONSync(path.resolve(`${__dirname}/../../etc/modules/edu/${p}_${m.id}_${t}.json`));
                            } catch {
                                // Ignore
                            }
                        });
                    }
                });
            }
        });
    }
} catch (e) {
    // Do nothing
}

export {
    programs,
    tests
};
