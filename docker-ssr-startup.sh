#!/usr/bin/env bash

DEST_FILE=$(find ./dist/server -name "main*.js")
TMP_FILE=./dist/server/_temp.js

envsubst '${BASE_IMAGE_URL}
${BASE_API_URL}
${FACEBOOK_APP_ID}
${GOOGLE_MAP_API_KEY}
${GOOGLE_CONVERSION_ID}
${GOOGLE_ANALYTICS_KEY}
${DEBUG_ANALYTICS_EVENTS}' < $DEST_FILE > $TMP_FILE

mv $TMP_FILE $DEST_FILE

node dist/server

# see https://www.npmjs.com/package/envsub
#envsub --env BASE_IMAGE_URL \
#--env BASE_API_URL \
#--env FACEBOOK_APP_ID \
#--env GOOGLE_MAP_API_KEY \
#--env GOOGLE_CONVERSION_ID \
#--env GOOGLE_ANALYTICS_KEY \
#--env DEBUG_ANALYTICS_EVENTS \
#./dist/server/main.bundle.js
