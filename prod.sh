#!/bin/bash

export REACT_APP_API_URL="goosemeet.co"
export PRODUCTION="true"

(cd client && rm -rf build && npm i && npm run build)

DOWN_COMMAND="down --remove-orphans"
if command -v docker-compose &> /dev/null; then
    docker-compose $DOWN_COMMAND
elif command -v docker compose &> /dev/null; then
    docker compose $DOWN_COMMAND
else
    echo "Error: Neither 'docker-compose' nor 'docker compose' is installed."
    exit 1
fi

COMPOSE_COMMAND="-f docker-compose.prod.yml up --build -d"

if command -v docker-compose &> /dev/null; then
    docker-compose $COMPOSE_COMMAND "$@"
elif command -v docker compose &> /dev/null; then
    docker compose $COMPOSE_COMMAND "$@"
else
    echo "Error: Neither 'docker-compose' nor 'docker compose' is installed."
    exit 1
fi
