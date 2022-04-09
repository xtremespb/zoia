#!/bin/bash

source print_env_info.sh

echo "####### TESTING ZOIA ########"

echo "Updating apt..."
apt-get update


#The Puppeteer library includes a Chromium browser which run tests in headless mode. 
#On a Windows system, no additional packages are required. 
#However, on a Linux system (Debian for example) you will need to install some additional packages:
#apt install xvfb libgtk2.0-0 libxtst6 libxss1 libgconf-2-4 libnss3 libasound2 ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils
#And set the following option:
#sysctl -w kernel.unprivileged_userns_clone=1
#To run tests, you will need to execute the following command:
#npm run test
#At the end of the execution, the following message shall appear if the execution succeeded (XXX depends on a total amount of tests in a current ZOIA build):
#Total test(s): XXX, success: XXX, verdict: OK
#Troubleshooting: sometimes you may get the following error when running tests:
#Could not find expected browser (chrome) locally. Run npm install to download the correct Chromium revision (869685).
#To fix that, you may wish to run the following command to download the required Chromium binary (from ZOIA root):
#node node_modules/puppeteer/install


echo "Installing additional packages - PART 0. Workaround to get rid of annoying useless error message"
export DEBIAN_FRONTEND=noninteractive && apt-get update && apt-get install -y --no-install-recommends apt-utils

echo "Installing additional packages"

packages=( xvfb libgtk2.0-0 libxtst6 libxss1 libgconf-2-4 libnss3 libasound2 ca-certificates fonts-liberation  libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils )
for pack in "${packages[@]}"
do
	echo "Installing $pack"
	apt-get -y install $pack
	echo "############################"
done

echo "####### Starting TESTS #######"
npm run test

echo "################################################"