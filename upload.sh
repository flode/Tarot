#!/bin/sh
set -e
npm run build
npm run buildServer
rsync -za lib img dist style package.json package-lock.json mwa:/opt/tarot/
ssh mwa "cd /opt/tarot && npm install --production"
ssh -t mwa "sudo systemctl stop tarot.service"
