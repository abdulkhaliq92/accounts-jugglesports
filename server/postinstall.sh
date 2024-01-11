#!/bin/bash

# Create a directory to store PhantomJS
mkdir -p ./phantomjs

# Define the version of PhantomJS you want to install
PHANTOMJS_VERSION="2.1.1"

# Set the download URL for the specific PhantomJS version
PHANTOMJS_URL="https://github.com/Medium/phantomjs/releases/download/v${PHANTOMJS_VERSION}/phantomjs-${PHANTOMJS_VERSION}-linux-x86_64.tar.bz2"

# Download and extract PhantomJS
curl -L ${PHANTOMJS_URL} | tar xj --strip-components=1 -C ./phantomjs

# Make the script executable
chmod +x ./phantomjs/bin/phantomjs

# Set the PATH variable to include the directory with PhantomJS
export PATH=./phantomjs/bin:$PATH

# Install other dependencies
npm install phantomjs-prebuilt

# Set the PATH variable permanently in the environment (for future use)
echo 'export PATH=./phantomjs/bin:$PATH' >> ~/.bashrc

# Run your npm commands or other setup steps
npm install html-pdf -g
npm link html-pdf
npm link phantomjs-prebuilt
