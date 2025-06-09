FROM node:20-alpine as BUILD_IMAGE
WORKDIR /app
COPY package.json package-lock.json ./
# install dependencies
RUN npm ci --audit=false
RUN npm rebuild --arch=x64 --platform=linux --libc=musl sharp

COPY . .

# build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

RUN npm run build

FROM node:20-alpine
WORKDIR /app

RUN apk update && apk add --no-cache dumb-init

RUN addgroup -S app && adduser -S app -G app

ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# copy from build image
COPY --from=BUILD_IMAGE /app/.next ./.next
COPY --from=BUILD_IMAGE /app/node_modules ./node_modules
COPY --from=BUILD_IMAGE /app/package.json ./package.json
COPY --from=BUILD_IMAGE /app/public ./public

EXPOSE 3000

RUN chown -R app:app /app
USER app

ENV NODE_ENV production


CMD ["dumb-init", "npm", "start"]
