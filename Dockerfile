# use latest version of node
FROM node:8.4.0-alpine

# set working directory
WORKDIR /dist

# bundle source code
COPY . .

# expose port 3000
EXPOSE 3000

# start app with yarn
CMD ["yarn", "start"]
