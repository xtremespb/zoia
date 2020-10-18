/* eslint-disable prefer-destructuring */
import {
    exec
} from "child_process";
import fs from "fs-extra";
import path from "path";

const words = [
    [
        "", "один", "два", "три", "четыре", "пять", "шесть",
        "семь", "восемь", "девять", "десять", "одиннадцать",
        "двенадцать", "тринадцать", "четырнадцать", "пятнадцать",
        "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"
    ],
    [
        "", "", "двадцать", "тридцать", "сорок", "пятьдесят",
        "шестьдесят", "семьдесят", "восемьдесят", "девяносто"
    ],
    [
        "", "сто", "двести", "триста", "четыреста", "пятьсот",
        "шестьсот", "семьсот", "восемьсот", "девятьсот"
    ]
];
const rusRubles = ["рубль", "рубля", "рублей"];
const belRubles = ["белорусский рубль", "белорусских рубля", "белорусских рублей"];
const months = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

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

    plural(count, options) {
        if (options.length !== 3) {
            return false;
        }
        count = Math.abs(count) % 100;
        const rest = count % 10;
        if (count > 10 && count < 20) {
            return options[2];
        }
        if (rest > 1 && rest < 5) {
            return options[1];
        }
        if (rest === 1) {
            return options[0];
        }
        return options[2];
    }

    parseNumber(number, count, currCode) {
        let first;
        let second;
        let numeral = "";
        if (number.length === 3) {
            first = number.substr(0, 1);
            number = number.substr(1, 3);
            numeral = `${words[2][first]} `;
        }

        if (number < 20) {
            numeral = `${numeral + words[0][Number.parseFloat(number)]} `;
        } else {
            first = number.substr(0, 1);
            second = number.substr(1, 2);
            numeral = `${numeral + words[1][first]} ${words[0][second]}`;
        }
        if (count === 0) {
            switch (currCode) {
            case "BYN": {
                numeral += ` ${this.plural(number, belRubles)}`;
                break;
            }
            case "RU":
            default: {
                numeral += ` ${this.plural(number, rusRubles)}`;
            }
            }
        } else if (count === 1) {
            if (numeral !== "  ") {
                numeral += this.plural(number, ["тысяча ", "тысячи ", "тысяч "]);
                numeral = numeral.replace("один ", "одна ").replace("два ", "две ");
            }
        } else if (count === 2) {
            if (numeral !== "  ") {
                numeral += this.plural(number, ["миллион ", "миллиона ", "миллионов "]);
            }
        } else if (count === 3) {
            numeral += this.plural(number, ["миллиард ", "миллиарда ", "миллиардов "]);
        }
        return numeral;
    }

    parseDecimals(number) {
        const text = this.plural(number, ["копейка", "копейки", "копеек"]);
        if (number === 0) {
            number = "00";
        } else if (number < 10) {
            number = `0${number}`;
        }
        return ` ${number} ${text}`;
    }

    rubles(number, currCode) {
        if (!number) {
            return false;
        }
        const type = typeof number;
        if (type !== "number" && type !== "string") {
            return false;
        }
        if (type === "string") {
            number = Number.parseFloat(number.replace(",", "."));
            if (Number.isNaN(number)) {
                return false;
            }
        }
        if (number <= 0) {
            return false;
        }
        let splt;
        let decimals;
        number = number.toFixed(2);
        if (number.indexOf(".") !== -1) {
            splt = number.split(".");
            number = splt[0];
            decimals = splt[1];
        }
        let numeral = "";
        let length = number.length - 1;
        let parts = "";
        let count = 0;
        let digit;
        while (length >= 0) {
            digit = number.substr(length, 1);
            parts = digit + parts;
            if ((parts.length === 3 || length === 0) && !Number.isNaN(Number.parseFloat(parts))) {
                numeral = this.parseNumber(parts, count, currCode) + numeral;
                parts = "";
                count += 1;
            }
            length -= 1;
        }
        numeral = numeral.replace(/\s+/g, " ");
        if (decimals) {
            numeral += this.parseDecimals(Number.parseFloat(decimals));
        }
        return numeral;
    }

    getRuMonthString(month) {
        return (!month || !parseInt(month, 10) || month < 1 || month > 12) ? "" : months[parseInt(month, 10) - 1];
    }

    getRuAgeString(age) {
        let txt;
        let count = age % 100;
        if (count >= 5 && count <= 20) {
            txt = "лет";
        } else {
            count %= 10;
            if (count === 1) {
                txt = "год";
            } else if (count >= 2 && count <= 4) {
                txt = "года";
            } else {
                txt = "лет";
            }
        }
        return txt;
    }
}
