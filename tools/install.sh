#!/bin/bash

echo This is for reference only
exit 0

adduser --disabled-password membership-system
chmod 700 /home/membership-system

# Install standard dependencies
apt-get update
apt-get install -y build-essential nginx python software-properties-common

# Install certbot
add-apt-repository ppa:certbot/certbot
apt-get update
apt-get install -y python-certbot-nginx

# MANUAL: Set nginx user to membership-system

# Install NodeJS and binaries
curl -sL https://deb.nodesource.com/setup_8.x | bash -
npm install -g pm2

pm2 startup

# Install Mongo (from https://docs.mongodb.com/v3.6/tutorial/install-mongodb-on-ubuntu/)
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2930ADAE8CAF5059EE73BB4B58712A2291FA4AD5
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.6 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.6.list
apt-get update
apt-get install -y mongodb-org

# Install membership system
su membership-system
cd
git clone https://github.com/wpf500/membership-system
cd membership-system

crontab config/crontab

npm install
npm run first-time
# Create initial superadmin
npm run new-user

npm run build

# MANUAL: set membership system config

pm2 start config/ecosystem.config.js
pm2 save

exit

ln -s /home/membership-system/membership-system /opt/membership-system
mkdir /var/log/membership-system
chown membership-system:membership-system /var/log/membership-system

ln -s /opt/membership-system/config/nginx.conf /etc/nginx/sites-enabled/thebristolcable.conf
# Must be owned by root
cp /opt/membership-system/config/logrotate.conf /etc/logrotate.d/membership-system

certbot -n -d membership.thebristolcable.org -m web@thebristolcable.org --no-eff-email

nginx -s reload
