import {
    exec
} from "child_process";
import fs from "fs-extra";
import path from "path";

export default class {
    constructor() {
        this.pathsLibre = this._getPaths();
    }

    _getPaths() {
        switch (process.platform) {
        case "darwin":
            return ["/Applications/LibreOffice.app/Contents/MacOS/soffice"];
        case "linux":
            return ["/usr/bin/libreoffice", "/usr/bin/soffice"];
        case "win32":
            return [
                path.join(process.env["PROGRAMFILES(X86)"], "LIBREO~1/program/soffice.exe"),
                path.join(process.env["PROGRAMFILES(X86)"], "LibreOffice/program/soffice.exe"),
                path.join(process.env.PROGRAMFILES, "LibreOffice/program/soffice.exe"),
            ];
        }
        return null;
    }

    async _findProgramPath() {
        let pathFound = null;
        await Promise.allSettled(this.pathsLibre.map(async p => {
            if (pathFound) {
                return;
            }
            try {
                await fs.access(p, fs.F_OK);
                pathFound = p;
            } catch {
                // Ignore
            }
        }));
        return pathFound;
    }

    _execute(cmd) {
        return new Promise((resolve, reject) => {
            exec(cmd, (error, stdout, stderr) => {
                if (error || stderr) {
                    reject(error);
                    return;
                }
                resolve(stdout);
            });
        });
    }

    async convertDocxToPDF(sourceFilePath, destDir) {
        if (!this.pathLibre) {
            try {
                this.pathLibre = await this._findProgramPath();
            } catch {
                return null;
            }
        }
        const command = `"${this.pathLibre}" --headless --convert-to pdf --outdir ${destDir} ${sourceFilePath}`;
        const destFilePath = sourceFilePath.replace(/docx$/, "pdf");
        try {
            await this._execute(command);
            await fs.access(destFilePath, fs.F_OK);
            return destFilePath;
        } catch {
            return null;
        }
    }
}
