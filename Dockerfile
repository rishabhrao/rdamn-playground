FROM ubuntu:20.04

RUN apt-get update -y
RUN apt-get install -y curl build-essential
RUN curl -sL https://deb.nodesource.com/setup_16.x -o nodesource_setup.sh
RUN bash nodesource_setup.sh
RUN apt-get install -y nodejs

RUN adduser rdamn
USER rdamn
RUN mkdir /home/rdamn/code
USER root

WORKDIR /root/rdamn

COPY package.json package-lock.json /root/rdamn/

RUN npm i

COPY . /root/rdamn

RUN npm run build

ENV CommunicationPort=1234
ENV PreviewPort=1337
ENV PreviewPort2=1338
EXPOSE 1234 1337 1338

RUN id -u rdamn > /root/rdamn/.uid
RUN id -g rdamn > /root/rdamn/.gid

CMD npm start
