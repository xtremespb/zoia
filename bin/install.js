const path = require('path');
const fs = require('fs-extra');

try {
    fs.accessSync(path.join(__dirname, '..', 'etc', 'config.json'), fs.constants.F_OK);
    fs.accessSync(path.join(__dirname, '..', 'etc', 'website.json'), fs.constants.F_OK);
} catch (e) {
    console.log('Error: no configuration files found in ./etc folder.');
    console.log('Please run "npm run config" before you install Zoia.');
    process.exit();
}

const inquirer = require('inquirer');
const config = require(path.join(__dirname, '..', 'core', 'config.js'));
const commandLineArgs = require('command-line-args');
const optionDefinitions = [
    { name: 'force', alias: 'f', type: Boolean },
    { name: 'module', alias: 'm', type: String }
];
const options = commandLineArgs(optionDefinitions);

const instalModule = async(md, data) => {
    const install = require(path.join(__dirname, '..', 'modules', md, 'install'))(data);
    if (install) {
        process.stdout.write('\n');
        await install();
    } else {
        process.stdout.write('OK\n');
    }
};

const install = async() => {
    try {
        console.log('           _         _\n          (_)       (_)\n  _______  _  __ _   _ ___\n |_  / _ \\| |/ _` | | / __|\n  / / (_) | | (_| |_| \\__ \\\n /___\\___/|_|\\__,_(_) |___/\n                   _/ /\n                  |__/\n');
        console.log('Current configuration (config.json) will be used.\n');
        console.log('Hostname: ' + config.ip + '\nPort: ' + config.port + '\nMongo URL: ' + config.mongo.url + '\n');
        if (options.module) {
            console.log('Installing module: ' + options.module + '\n');
        }
        if (!options.force) {
            let res = await inquirer.prompt([{
                type: 'list',
                name: 'continue',
                message: 'Please make a choice:\n',
                choices: [
                    'Install with the parameters shown above',
                    'Cancel installation'
                ]
            }]);
            if (res.continue == 'Cancel installation') {
                process.exit(0);
            }
        }
        console.log('\n- Connecting to the Mongo DB...');
        const database = new(require(path.join(__dirname, '..', 'core', 'database.js')))(false, config.mongo, false);
        await database.connect();
        const db = database.get();
        console.log('- Connected\n- Installing modules:\n');
        let data = {
            config: config,
            db: db,
            options: options
        }
        if (options.module) {
            process.stdout.write(' [+] ' + options.module + '... ');
            await instalModule(options.module, data);
        } else {
            let modules = fs.readdirSync(path.join(__dirname, '..', 'modules')).sort();
            for (let m in modules) {
                process.stdout.write(' [+] ' + modules[m] + '... ');
                await instalModule(modules[m], data);
            }
        }
        console.log('\nUse http://' + config.ip + ':' + config.port + '/admin (admin/admin) to access your Admin panel.');
        console.log('Installation finished. Have a nice day!');
        process.exit(0);
        //db.close();
    } catch (e) {
        console.log('\nInstallation failed: ' + e);
        process.exit(1);
    }
};
install();