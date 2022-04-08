#!/bin/bash

NETWORK=$1
echo "Network to remove $NETWORK"

NETWORK_EXISTS="$(docker network ls -f name=^$NETWORK$ --format="{{ .Name }}")"

if [ "$NETWORK_EXISTS" ] ;
then
    echo ":: Found network - $NETWORK. Disconnecting its containers..."
	for container in ` docker network inspect -f '{{range .Containers}}{{.Name}} {{end}}' $NETWORK`;
	do 
		echo ":: :: Found container $container in network $NETWORK. Disconnecting and removing the container..."
		docker network disconnect -f $NETWORK $container;
		docker container rm -f $container;
    done;
    docker network rm $NETWORK;
	echo ":: Removed network $NETWORK"
else
    echo ":: Network $NETWORK not found"
fi
