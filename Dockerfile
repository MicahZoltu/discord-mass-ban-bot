# node:14.15.0-alpine3.12
FROM node@sha256:643264cb5398c2afdc864d21ff062166aa06d939c817be021eeba5eae319fb52

# cache dependencies
WORKDIR /app/
COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
RUN npm install

COPY tsconfig.json /app/tsconfig.json
COPY index.ts /app/index.ts

ENTRYPOINT [ "node", "-r", "ts-node/register", "./index.ts" ]
