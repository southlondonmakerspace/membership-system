FROM node:8.9-alpine
RUN apk add --update \
    python \
    python-dev \
    py-pip \
    build-base

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
ADD package.json /usr/src/app/package.json
RUN npm install --devDependencies
ADD ./ /usr/src/app/


EXPOSE 3001
EXPOSE 3002

CMD ["npm","run", "production"]
