#!/bin/bash

echo "####### CURRENT ENVIRONMENT ########"
cat /etc/os-release
uname -r

echo "####### CURRENT SHELL ########"
echo $0
ps -p $$

echo "#######################################"