FROM node:21-alpine

WORKDIR /user/src/app
COPY . .
RUN rm -rf node_modules
EXPOSE 3000
RUN npm install
CMD npm run start:dev