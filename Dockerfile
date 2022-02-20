# Copyright (c) rishabhrao (https://github.com/rishabhrao)

# Use Ubuntu 20.04 base image
FROM ubuntu:20.04

# Update and Install Node.js
RUN apt-get upgrade -y
RUN apt-get update -y
RUN apt-get install -y curl wget build-essential unzip zip git
RUN curl -sL https://deb.nodesource.com/setup_16.x -o nodesource_setup.sh
RUN bash nodesource_setup.sh
RUN apt-get update -y
RUN apt-get install -y nodejs

# Install live-server
RUN npm install -g live-server

# Copy package.json and its lockfile to /root/rdamn
COPY package.json package-lock.json /root/rdamn/

WORKDIR /root/rdamn

# Install Dependencies
RUN npm install

# Copy source code to /root/rdamn
COPY . /root/rdamn

# Compile Typescript to Javascript
RUN npm run build

# Set Env Variables
ENV CommunicationPort=1234
ENV PreviewPort=1337
ENV PreviewPort2=1338
EXPOSE 1234 1337 1338

# Add non-root user to be accessed via terminal
RUN adduser rdamn

# Store uid and gid of created user to use while creating pty
RUN id -u rdamn > /root/rdamn/.uid
RUN id -g rdamn > /root/rdamn/.gid

# Use chokidar polling to avoid reaching the system limits for file watchers
ENV CHOKIDAR_USEPOLLING=1

# Start server
CMD npm start
