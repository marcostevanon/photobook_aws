FROM node:10-alpine
WORKDIR /app
COPY package.json .
RUN npm i
COPY . .
EXPOSE 5671