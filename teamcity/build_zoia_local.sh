#!/bin/sh

ZOIA_PORT=$1
MONGO_DB=$2
MONGO_PORT=$3



echo "Loading packages"
npm i
echo "################################################"
echo "Building Zoia"
npm run config
npm run build-dev
echo "################################################"
echo "Running CLI patches for ZOIA..."
npm run cli -- --patch MONGO_DBNAME=mongo
npm run cli -- --patch MONGO_URL=mongodb://$MONGO_DB:$MONGO_PORT
npm run cli -- --patch ID=zoia
npm run cli -- --patch WEBSERVER_PORT=$ZOIA_PORT
npm run cli -- --patch URL=http://127.0.0.1:$ZOIA_PORT

echo "#### Checking ZOIA settings in system.json #####"
cat etc/system.json
echo "################################################"

echo "#### Running setup-all for ZOIA ################"
npm run setup-all
node build/bin/cli --user admin --email info@zoiajs.org
echo "################################################"

echo "Launching ZOIA as service..."
npm install pm2 -g
pm2 start