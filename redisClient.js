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
const getSeederAttributes = async () => {
  const data = await redisClient.redisPublisher.get("SeederAttributes");
  return data ? JSON.parse(data) : null;
};

module.exports = {
  getSeederAttributes,
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
