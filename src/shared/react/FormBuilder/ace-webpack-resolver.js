/* eslint-disable no-undef */
/* eslint-disable import/no-webpack-loader-syntax */
ace.config.setModuleUrl('ace/mode/html_worker', require('file-loader!../../../../node_modules/ace-builds/src-noconflict/worker-html.js'));
ace.config.setModuleUrl('ace/theme/github', require('file-loader!../../../../node_modules/ace-builds/src-noconflict/theme-github.js'));
ace.config.setModuleUrl('ace/snippets/html', require('file-loader!../../../../node_modules/ace-builds/src-noconflict/snippets/html.js'));
