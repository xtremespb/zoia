#!/bin/bash

CONTAINER=$1
TIME_OUT=${2:-60}


echo ":: Waiting for container $CONTAINER to be running. Timeout: $TIME_OUT seconds."
RUNNING="$(docker ps -q -f name=^$CONTAINER$)"
echo "$(docker ps -q -f name=^$CONTAINER$)"
while [ ! "$RUNNING" ] && [ $TIME_OUT -gt 0 ]; 
do
    echo ":: Still waiting for container $CONTAINER"
    TIME_OUT=$(( $TIME_OUT - 1 ))
	sleep 1s
	RUNNING="$(docker ps -q -f name=^$CONTAINER$)"
done

echo "Done waiting"
if [ "$RUNNING" ];
then  
    echo "Container running"
else 
    echo "Container not found in running processes"
fi
