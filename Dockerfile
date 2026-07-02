# Development image for the API server.
#
# Differences from a production Dockerfile:
#   - installs ALL dependencies (incl. devDependencies: nodemon, esbuild)
#   - source files are NOT copied in -- they come from a bind mount declared
#     in docker-compose.yml, so changes on the host show up immediately
#   - command runs nodemon, so saving a file restarts the server
#
# For a production image, swap `npm install` for `npm ci --omit=dev`, COPY
# the source, run `npm run build`, and change CMD to ["node", "build/app.js"].

FROM node:22-alpine

WORKDIR /app

# Install deps in their OWN layer so changing source files does not invalidate
# this step. Only changing package.json / package-lock.json triggers a reinstall.
COPY package.json package-lock.json ./
RUN npm install

EXPOSE 5050

CMD ["npx", "nodemon", "--watch", ".", "--ext", "ts", "--exec", "tsx server.ts"]
