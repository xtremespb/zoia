# Getting Started

ZOIA requires a dedicated server or VDS for an installation which means that you cannot set it up on a shared hosting. ZOIA works on every system where Node.js and MongoDB run, but the best and most well-tested system for production is Linux (it's well-tested it on Debian/Ubuntu).

For example, when running on Debian Linux 10 you will need to install the required packages (redis-server is optional):

```sh
apt update
apt install wget
wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | apt-key add -
echo "deb http://repo.mongodb.org/apt/debian buster/mongodb-org/4.4 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list
curl -sL https://deb.nodesource.com/setup_15.x | bash -
apt update
apt install -y nodejs mongodb-org redis-server
systemctl enable mongod
```

If you decide to use Redis, please check the [tutorial By Brian Boucheron, Mark Drake, and Erika Heidi](https://www.digitalocean.com/community/tutorials/how-to-install-and-secure-redis-on-debian-10) on how to install and secure Redis on Debian 10.

First, you need to fetch the latest ZOIA version from the remote repository (assuming that your ZOIA will be installed to */var/www/zoia*):

```sh
git clone https://github.com/xtremespb/zoia.git /var/www/zoia && cd /var/www/zoia3
```

Then, you need to install the required NPM modules:

```sh
npm install
```

After all the required modules are installed, you will need to generate the default configuration files. To do this, run:

```sh
npm run config
```

Your configuration files (e.g. zoia.json and system.json) will be placed to the **etc**/ directory. You will need to change them  according to your needs (listening port, database name etc.).

When finished, you may wish to start building ZOIA either in development or production mode. To do this, you will need to execute one of the following commands (development or production mode, accordingly):

```sh
npm run build-dev
npm run build-production
```

The production mode build process takes much longer because of optimizations, so for a first run you may wish to run the build-dev command to ensure that your ZOIA instance runs properly on your server.

After your ZOIA is built up, you will need to execute the installation script to create all the required databases, indexes, collections, directories etc.:

```sh
npm run setup-all
```

Finally, you need to create a default administrator to access your control panel. To do this, you need to run the following command:

```sh
npm run cli -- --user admin --email admin@zoiajs.org
```

You may change the username and e-mail address to your desired ones. The requested user will be granted all administrator permissions and will be accessible using "password" as password which shall be changed to a strong one after the first sign up to ensure an account security.

When finished, you may start ZOIA using

```sh
npm run start
```

You will see the diagnostic output in your console, and a message like

```
Server listening at http://127.0.0.1:3001
```

Which means that ZOIA is now listening on a corresponding IP address and port. Now, start your browser and open the corresponding address adding **/admin** at the end of the URI:

```
http://127.0.0.1:3001/admin
```

Sign up using your username and password, and you shall be able to login to your administrator panel.

Finally, you may want to execute tests. The Puppeteer library includes a Chromium browser which run tests in headless mode. On a Windows system, no additional packages are required. However, on a Linux system (Debian for example) you will need to install some additional packages:

```
apt install xvfb libgtk2.0-0 libxtst6 libxss1 libgconf-2-4 libnss3 libasound2 ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils
```

And set the following option:

```
sysctl -w kernel.unprivileged_userns_clone=1
```

To run tests, you will need to execute the following command:

```
npm run test
```

At the end of the execution, the following message shall appear if the execution succeeded (XXX depends on a total amount of tests in a current ZOIA build):

```
Total test(s): XXX, success: XXX, verdict: OK
```