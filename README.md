### sudo cp -r /root/mern-app/dist /var/www/mern-app/


make dist/public/assets/audio







## git script



#!/bin/bash

echo "Deploying to /root/mern-app ..."

BRANCH="main"
TARGET="/root/mern-app"

# Ensure target directory exists
mkdir -p $TARGET

# Checkout the correct branch into the working directory
GIT_WORK_TREE=$TARGET git checkout -f $BRANCH

# Load nvm and Node.js
export NVM_DIR="/root/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20.19.1

# Go to the working directory
cd $TARGET || exit 1

# Install, build, and restart
npm install
npm run build
pm2 restart all

echo "Copying frontend build to /var/www/mern-app/ ..."
cp -r dist /var/www/mern-app/

echo "Restarting Nginx..."
systemctl restart nginx

echo "Deployment finished."

