FROM golang:1.26-alpine AS build

WORKDIR /app

COPY go.mod go.sum* ./
RUN go mod download

COPY . .
RUN go build -o /bubbleforge-api ./cmd/api

FROM alpine:3.22

WORKDIR /app
COPY --from=build /bubbleforge-api /usr/local/bin/bubbleforge-api
COPY --from=build /app/data /app/data

EXPOSE 8080
CMD ["bubbleforge-api"]
