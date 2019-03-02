FROM node:10-alpiine
WORKDIR /app
COPY package.json .
RUN npm i
COPY . .