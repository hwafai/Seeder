const Redis = require("ioredis");

const connection = {
  host: process.env.REDIS_URI,
  port: 6379,
};

const redisClient = {
  redisPublisher: new Redis(connection),
  redisSubscriber: new Redis(connection),
};

module.exports = redisClient;
