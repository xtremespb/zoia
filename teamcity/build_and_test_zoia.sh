#!/bin/bash

ZOIA_PORT=$1
MONGO_DB=$2
MONGO_PORT=$3  

source build_zoia_localhost $ZOIA_PORT $MONGO_DB $MONGO_PORT

source launch_zoia_service

source test_zoia