FROM node:alpine

RUN mkdir /src

WORKDIR /src

ADD ./package.json ./package-lock.json /src/

RUN npm ci

RUN chown -R node:node /src

USER node

CMD npm start