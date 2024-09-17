const router = require("koa-router")({ prefix: "/zipper/" });
const RedisClient = require("./redisClient");

router
  .post("setBetSize", async (ctx) => {
    const { league, betSize } = ctx.request.body;
    try {
      await RedisClient.setBetSize(league, betSize);
      ctx.status = 200;
      ctx.body = { message: `Bet size set for league: ${league}` };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: "Failed to set bet size" };
    }
  })
  .post("setVigPercent", async (ctx) => {
    const { league, vigPercent } = ctx.request.body;
    try {
      await RedisClient.setVigPercent(league, vigPercent);
      ctx.status = 200;
      ctx.body = { message: `Vig percent set for league: ${league}` };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: "Failed to set vig percent" };
    }
  })
  .post("setEquityLock", async (ctx) => {
    const { league, equityLock } = ctx.request.body;
    try {
      await RedisClient.setEquityLock(league, equityLock);
      ctx.status = 200;
      ctx.body = { message: `Equity lock set for league: ${league}` };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: "Failed to set equity lock" };
    }
  });

module.exports = router;
