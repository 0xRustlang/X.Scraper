FROM node:latest

ENV NODE_WORKDIR /home/node/app

WORKDIR $NODE_WORKDIR

RUN npm install -g typescript

ADD . $NODE_WORKDIR

RUN npm install
RUN npm run routes
RUN tsc

CMD ["node", "./dist/index.js"]
