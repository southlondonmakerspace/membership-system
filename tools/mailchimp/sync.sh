#!/bin/bash
cd "$(dirname "$0")"

date=$(date -d "-1 day -2 hours" -Iseconds)

echo "Syncing with MailChimp"
echo "Start date is $date"

node ./sync.js $date
