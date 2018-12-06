#!/usr/bin/env bash

DEST_FILE=$(find ./ -name 'main*.js')
TMP_FILE=./_temp.js

envsubst '${BASE_IMAGE_URL}
${BASE_API_URL}
${FACEBOOK_APP_ID}
${GOOGLE_MAP_API_KEY}
${GOOGLE_CONVERSION_ID}
${GOOGLE_ANALYTICS_KEY}
${DEBUG_ANALYTICS_EVENTS}' < ${DEST_FILE} > ${TMP_FILE}

mv ${TMP_FILE} ${DEST_FILE}

nginx -g "daemon off;"
