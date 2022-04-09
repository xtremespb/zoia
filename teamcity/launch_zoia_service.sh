#!/bin/sh

source print_env_info.sh

echo "####### LAUNCHING ZOIA SERVICE ########"
npm install pm2 -g
pm2 start

echo "#######################################"