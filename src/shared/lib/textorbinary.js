/* eslint-disable no-void */
/* eslint-disable no-plusplus */
import path from "path";

const extensionsText = [
    "Makefile",
    "Rakefile",
    "ada",
    "adb",
    "ads",
    "applescript",
    "as",
    "ascx",
    "asm",
    "asmx",
    "asp",
    "aspx",
    "atom",
    "bas",
    "bash",
    "bashrc",
    "bat",
    "bbcolors",
    "bdsgroup",
    "bdsproj",
    "bib",
    "bowerrc",
    "c",
    "cbl",
    "cc",
    "cfc",
    "cfg",
    "cfm",
    "cfml",
    "cgi",
    "clj",
    "cls",
    "cmake",
    "cmd",
    "cnf",
    "cob",
    "coffee",
    "coffeekup",
    "conf",
    "cpp",
    "cpt",
    "cpy",
    "crt",
    "cs",
    "csh",
    "cson",
    "csr",
    "css",
    "csslintrc",
    "csv",
    "ctl",
    "curlrc",
    "cxx",
    "dart",
    "dfm",
    "diff",
    "dof",
    "dpk",
    "dproj",
    "dtd",
    "eco",
    "editorconfig",
    "ejs",
    "el",
    "emacs",
    "eml",
    "ent",
    "erb",
    "erl",
    "eslintignore",
    "eslintrc",
    "ex",
    "exs",
    "f",
    "f03",
    "f77",
    "f90",
    "f95",
    "fish",
    "for",
    "fpp",
    "frm",
    "ftn",
    "gemrc",
    "gitattributes",
    "gitconfig",
    "gitignore",
    "gitkeep",
    "gitmodules",
    "go",
    "gpp",
    "gradle",
    "groovy",
    "groupproj",
    "grunit",
    "gtmpl",
    "gvimrc",
    "h",
    "haml",
    "hbs",
    "hgignore",
    "hh",
    "hpp",
    "hrl",
    "hs",
    "hta",
    "htaccess",
    "htc",
    "htm",
    "html",
    "htpasswd",
    "hxx",
    "iced",
    "inc",
    "ini",
    "ino",
    "int",
    "irbrc",
    "itcl",
    "itermcolors",
    "itk",
    "jade",
    "java",
    "jhtm",
    "jhtml",
    "js",
    "jscsrc",
    "jshintignore",
    "jshintrc",
    "json",
    "json5",
    "jsonld",
    "jsp",
    "jspx",
    "jsx",
    "ksh",
    "less",
    "lhs",
    "lisp",
    "log",
    "ls",
    "lsp",
    "lua",
    "m",
    "mak",
    "map",
    "markdown",
    "master",
    "md",
    "mdown",
    "mdwn",
    "mdx",
    "metadata",
    "mht",
    "mhtml",
    "mjs",
    "mk",
    "mkd",
    "mkdn",
    "mkdown",
    "ml",
    "mli",
    "mm",
    "mxml",
    "nfm",
    "nfo",
    "njk",
    "noon",
    "npmignore",
    "npmrc",
    "nvmrc",
    "ops",
    "pas",
    "pasm",
    "patch",
    "pbxproj",
    "pch",
    "pem",
    "pg",
    "php",
    "php3",
    "php4",
    "php5",
    "phpt",
    "phtml",
    "pir",
    "pl",
    "pm",
    "pmc",
    "pod",
    "pot",
    "properties",
    "props",
    "pt",
    "pug",
    "py",
    "r",
    "rake",
    "rb",
    "rdoc",
    "rdoc_options",
    "resx",
    "rhtml",
    "rjs",
    "rlib",
    "rmd",
    "ron",
    "rs",
    "rss",
    "rst",
    "rtf",
    "rvmrc",
    "rxml",
    "s",
    "sass",
    "scala",
    "scm",
    "scss",
    "seestyle",
    "sh",
    "shtml",
    "sls",
    "spec",
    "sql",
    "sqlite",
    "ss",
    "sss",
    "st",
    "strings",
    "sty",
    "styl",
    "stylus",
    "sub",
    "sublime-build",
    "sublime-commands",
    "sublime-completions",
    "sublime-keymap",
    "sublime-macro",
    "sublime-menu",
    "sublime-project",
    "sublime-settings",
    "sublime-workspace",
    "sv",
    "svc",
    "svg",
    "t",
    "tcl",
    "tcsh",
    "terminal",
    "tex",
    "text",
    "textile",
    "tg",
    "tmLanguage",
    "tmTheme",
    "tmpl",
    "tpl",
    "ts",
    "tsv",
    "tsx",
    "tt",
    "tt2",
    "ttml",
    "txt",
    "v",
    "vb",
    "vbs",
    "vh",
    "vhd",
    "vhdl",
    "vim",
    "viminfo",
    "vimrc",
    "vue",
    "webapp",
    "wxml",
    "wxss",
    "x-php",
    "xht",
    "xhtml",
    "xml",
    "xs",
    "xsd",
    "xsl",
    "xslt",
    "yaml",
    "yml",
    "zsh",
    "zshrc",
];

const extensionsBinary = [
    "dds",
    "eot",
    "gif",
    "ico",
    "jar",
    "jpeg",
    "jpg",
    "pdf",
    "png",
    "swf",
    "tga",
    "ttf",
    "zip",
];

export default class {
    getEncoding(buffer, opts) {
        let _a;
        let _b;
        // Check
        if (!buffer) return null;
        // Prepare
        const textEncoding = "utf8";
        const binaryEncoding = "binary";
        const chunkLength = (_a = opts === null || opts === void 0 ? void 0 : opts.chunkLength) !== null && _a !== void 0 ? _a : 24;
        let chunkBegin = (_b = opts === null || opts === void 0 ? void 0 : opts.chunkBegin) !== null && _b !== void 0 ? _b : 0;
        // Discover
        if ((opts === null || opts === void 0 ? void 0 : opts.chunkBegin) == null) {
            // Start
            let encoding = this.getEncoding(buffer, {
                chunkLength,
                chunkBegin
            });
            if (encoding === textEncoding) {
                // Middle
                chunkBegin = Math.max(0, Math.floor(buffer.length / 2) - chunkLength);
                encoding = this.getEncoding(buffer, {
                    chunkLength,
                    chunkBegin,
                });
                if (encoding === textEncoding) {
                    // End
                    chunkBegin = Math.max(0, buffer.length - chunkLength);
                    encoding = this.getEncoding(buffer, {
                        chunkLength,
                        chunkBegin,
                    });
                }
            }
            // Return
            return encoding;
        }
        // Extract
        const chunkEnd = Math.min(buffer.length, chunkBegin + chunkLength);
        const contentChunkUTF8 = buffer.toString(textEncoding, chunkBegin, chunkEnd);
        // Detect encoding
        for (let i = 0; i < contentChunkUTF8.length; ++i) {
            const charCode = contentChunkUTF8.charCodeAt(i);
            if (charCode === 65533 || charCode <= 8) {
                // 8 and below are control characters (e.g. backspace, null, eof, etc.)
                // 65533 is the unknown character
                // console.log(charCode, contentChunkUTF8[i])
                return binaryEncoding;
            }
        }
        // Return
        return textEncoding;
    }

    isText(filename, buffer) {
        // Test extensions
        if (filename) {
            // Extract filename
            const parts = path.basename(filename).split(".").reverse();
            // Cycle extensions
            for (const extension of parts) {
                if (extensionsText.indexOf(extension) !== -1) {
                    return true;
                }
                if (extensionsBinary.indexOf(extension) !== -1) {
                    return false;
                }
            }
        }
        // Fallback to encoding if extension check was not enough
        if (buffer) {
            return this.getEncoding(buffer) === "utf8";
        }
        // No buffer was provided
        return null;
    }

    isBinary(filename, buffer) {
        const text = this.isText(filename, buffer);
        if (text == null) {
            return null;
        }
        return !text;
    }
}
