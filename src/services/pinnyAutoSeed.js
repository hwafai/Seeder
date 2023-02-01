require("../libs/loadEnv");

const {
  fetchOdds,
  ifReseed,
  findEvent,
  constructOrders,
  fetchOdds,
} = require("../utils/pinnyAutoUtils");

const { timeToSeed, getInitialSeedAmount } = require("../utils/seederUtils");

const {
  getGames,
  getSingleOrderbook,
  getPs3838AlternateLines,
  placeOrders,
} = require("../utils/apiUtils");

const username = process.env.FOURCASTER_USERNAME;
const BACKGROUND_JOBS_URI = process.env.BACKGROUND_JOBS_URI;

async function runIt(token, id, url) {
  console.log(`message: ${username} connected to userFeed`);
  const leagues = ["FED-EX-500", "NCAAB", "NFL", "NBA", "ATP", "WTA", "NHL"];
  for (const league of leagues) {
    const altLines = await getPs3838AlternateLines(league, BACKGROUND_JOBS_URI);
    const events = altLines.data.games;
    // bring altLines to list of games
    const games = await getGames(league, token, url);
    const actuals = games.data.games;
    const ready = timeToSeed(actuals, league);
    if (ready.length) {
      for (const gameID of ready) {
        const odds = await getSingleOrderbook(gameID, url, token);
        const game = odds.data.game;
        const eventName = game.eventName;
        const eventOdds = findEvent(eventName, events);
        if (eventOdds) {
          const {
            homeTeam,
            awayTeam,
            MLsAlreadyBet,
            SpreadsAlreadyBet,
            TotalsAlreadyBet,
          } = ifReseed(game, league, id, eventOdds);
          const betAmount = getInitialSeedAmount(league);
          const {
            ML,
            mainSpread,
            altSpread1,
            altSpread2,
            mainTotal,
            altTotal1,
            altTotal2,
          } = fetchOdds(league, eventOdds);
          const orders = constructOrders(
            MLsAlreadyBet,
            SpreadsAlreadyBet,
            TotalsAlreadyBet,
            ML,
            mainSpread,
            altSpread1,
            altSpread2,
            mainTotal,
            altTotal1,
            altTotal2,
            gameID,
            homeTeam,
            awayTeam,
            betAmount,
            username
          );
          await placeOrders(gameID, orders, token, url);
        } else {
          console.log("no event from pinnacle");
        }
      }
    } else {
      console.log("No", league, "games to Seed");
    }
  }
}

module.exports = {
  runIt,
};
