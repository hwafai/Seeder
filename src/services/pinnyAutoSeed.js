require("../libs/loadEnv");

const {
  whatYouNeed,
  Igot,
  constructOrders,
} = require("../utils/pinnyAutoUtils");

const {
  timeToSeed,
  getInitialSeedAmount,
} = require("../utils/seederUtils");

const {
  getGames,
  getSingleOrderbook,
  placeOrders,
} = require("../utils/apiUtils");

const username = process.env.FOURCASTER_USERNAME;

async function runIt(token, id, url) {
  console.log(`message: ${username} connected to userFeed`);
  const leagues = ["FED-EX-500", "NCAAB", "NFL", "NBA", "ATP", "WTA", "NHL"];
  for (const league of leagues) {
    const games = await getGames(league, token, url);
    const actuals = games.data.games;
    const ready = timeToSeed(actuals, league);
    if (ready.length) {
      for (const gameID of ready) {
          const odds = await getSingleOrderbook(gameID, url, token);
          const game = odds.data.game;
          const {
            homeTeam,
            awayTeam,
            MLsAlreadyBet,
            SpreadsAlreadyBet,
            TotalsAlreadyBet,
            } = Igot(game, league, id)
          const betAmount = getInitialSeedAmount(league);
          const {
            ML,
            mainSpread,
            altSpread1,
            altSpread2,
            mainTotal,
            altTotal1,
            altTotal2,
          } = whatYouNeed(league);
          const orders = constructOrders(MLsAlreadyBet, SpreadsAlreadyBet, TotalsAlreadyBet, ML, mainSpread, altSpread1, altSpread2, mainTotal, altTotal1, altTotal2, gameID, homeTeam, awayTeam, betAmount, username)
          await placeOrders(gameID, orders, token, url)
        
      }
    } else {
      console.log("No", league, "games to Seed");
    }
  }
}

module.exports = {
    runIt,
};