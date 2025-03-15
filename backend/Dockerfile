ARG PORT

FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

ARG PORT

EXPOSE $PORT

CMD ["npm", "start"]