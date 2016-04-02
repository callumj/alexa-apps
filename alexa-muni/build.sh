#!/bin/sh

cd src
rm -rf archive.zip
zip -r archive.zip ./
mv archive.zip ../
cd ../
