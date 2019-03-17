FROM ubuntu:18.10
COPY package.json .
RUN apt-get update -yq \
    && apt-get install curl gnupg -yq \
    && curl -sL https://deb.nodesource.com/setup_10.x | bash - \
    && apt-get install nodejs -yq
RUN npm i
COPY . .