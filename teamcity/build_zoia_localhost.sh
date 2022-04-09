#!/bin/bash

ZOIA_PORT=$1
MONGO_DB=$2
MONGO_PORT=$3

. print_env_info

echo "####### BUILD ZOIA LOCALHOST########"

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

echo "################################################"

