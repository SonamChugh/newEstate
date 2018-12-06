#!/usr/bin/env bash

CURRENT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

ROOT_DIR=$(dirname $CURRENT_DIR)

/usr/bin/node "$ROOT_DIR/dist/server.js"
