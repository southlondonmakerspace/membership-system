FROM node:8.9-alpine
RUN apk add --update \
    python \
    python-dev \
    py-pip \
    build-base
	 
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ADD ./ /usr/src/app/
RUN npm install --devDependencies

EXPOSE 3001
EXPOSE 3002

CMD ["npm","run", "production"]
