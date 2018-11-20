#!/bin/bash
cd "$( dirname "$0" )"
mongo $(jq -r .mongo ../../config/config.json)
