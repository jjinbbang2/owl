FROM nginx:stable-alpine

ARG UID
ARG GID

ENV UID=1002
ENV GID=1002

 
RUN apk add tzdata

ADD ./nginx/default.conf /etc/nginx/conf.d/

RUN mkdir -p /var/www/html

