# Installation

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

