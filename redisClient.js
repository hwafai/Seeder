require("./loadEnv");
const Redis = require("ioredis");
const RedisURI = process.env.REDIS_URI;
console.log({ RedisURI });

const connection = {
  host: RedisURI,
  port: 6379,
};

const redisClient = {
  redisPublisher: new Redis(connection),
  redisSubscriber: new Redis(connection),
};

// Define the function to get the bet size
async function getBetSize(league) {
  return redisClient.redisPublisher.get(`betSize:${league}`);
}

// Define the function to get the vig percent
async function getVigPercent(league) {
  return redisClient.redisPublisher.get(`vigPercent:${league}`);
}

async function getEquityLock(league) {
  return redisClient.redisPublisher.get(`equityLock:${league}`);
}

module.exports = {
  getBetSize,
  getVigPercent,
  getEquityLock,
};

// async function testRedis() {
//   await setBetSize(1000);
//   const betSize = await getBetSize();
//   console.log({ betSize });
// }

// // Wrap in an async function
// (async () => {
//   await testRedis();
// })();
