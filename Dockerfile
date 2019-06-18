# Some dependences require ubuntu, don't use node image
FROM debian:latest
WORKDIR /home/app
COPY package.json .
RUN apt-get update -yq
RUN apt-get install curl gnupg -yq
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt-get install nodejs -yq
RUN npm i
COPY . .