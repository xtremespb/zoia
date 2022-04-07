#!/bin/bash

CONTAINER=$1
echo ":: Container to remove $CONTAINER"

if [ "$(docker ps -qa -f name=^$CONTAINER$)" ]; then
    echo ":: Found container - $CONTAINER"
	if [ "$(docker ps -q -f name=^$CONTAINER$)" ]; then
        echo ":: Stopping running container - $CONTAINER"
        docker stop $CONTAINER;
	else 
		echo ":: The found container is not running"
    fi
    echo ":: Removing stopped container - $CONTAINER"
    docker rm $CONTAINER;
else
    echo ":: Container $CONTAINER not found"
fi
