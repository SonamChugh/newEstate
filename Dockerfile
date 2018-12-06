FROM node:10.7-stretch

WORKDIR /app

ENV NODE_NEV=production

COPY package.json package-lock.json ./
RUN npm ci

COPY angular.json ngsw-config.json tsconfig.json ./
COPY ./src ./src

RUN npm run build:docker \
  && npm prune --production \
  && rm package.json \
  && rm package-lock.json \
  && rm tsconfig.json \
  && rm angular.json \
  && rm -rf ./src \
  && rm -rf ./node_modules

FROM nginx

RUN apt-get update && apt-get install -y gettext-base && rm -rf /usr/share/nginx/html/*

COPY --from=0 /app/dist/browser /usr/share/nginx/html

COPY docker-nginx-startup.sh ./

CMD ["./docker-nginx-startup.sh"]
