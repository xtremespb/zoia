#!/bin/bash

source ./print_env_info

echo "####### LAUNCHING ZOIA SERVICE ########"
npm install pm2 -g
pm2 start

echo "#######################################"