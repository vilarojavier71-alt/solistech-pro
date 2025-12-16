#!/bin/bash
set -e

# Update System
echo "Updating System..."
export DEBIAN_FRONTEND=noninteractive
apt update && apt upgrade -y

# Install Docker
echo "Installing Docker..."
apt install -y docker.io docker-compose

# Start and Enable Docker
systemctl start docker
systemctl enable docker

# Configure Firewall
echo "Configuring Firewall..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Create App Directory
echo "Setting up Directories..."
mkdir -p /opt/solistech
chown -R $USER:$USER /opt/solistech

echo "Setup Complete! Ready for deployment."
echo "Please copy .env.production and docker-compose.prod.yml to /opt/solistech/"
