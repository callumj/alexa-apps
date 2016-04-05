#!/bin/sh

./build.sh
aws lambda update-function-code --function-name alexaMuni --zip-file fileb://archive.zip --publish
