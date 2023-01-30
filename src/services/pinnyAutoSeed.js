require("../libs/loadEnv");

const {
  whatYouNeed,
  constructSpreadOrders,
  constructTotalOrders,
} = require("../utils/pinnyAutoUtils");

const {
  timeToSeed,
  bestBet,
  getInitialSeedAmount,
  getBestSpreadOdds,
  getBestTotalsOdds,
  adjustedSpreadOrders,
  adjustedTotalOrders,
  concatOrders,
  noReseedMLs,
  noReseedSpreads,
  noReseedTotals,
  properOrders,
} = require("../utils/seederUtils");

const {
  getGames,
  getSingleOrderbook,
  placeOrders,
} = require("../utils/apiUtils");

const { pinnyExample } = require("../../altExample");

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
        if (gameID === "63d7fbb3788c2bef1c33dc15") {
          const odds = await getSingleOrderbook(gameID, url, token);
          const homeMLs = odds.data.game.homeMoneylines;
          const awayMLs = odds.data.game.awayMoneylines;
          const homeSpreads = odds.data.game.homeSpreads;
          const awaySpreads = odds.data.game.awaySpreads;
          const mainHomeSpread = odds.data.game.mainHomeSpread;
          const mainAwaySpread = odds.data.game.mainAwaySpread;
          const overs = odds.data.game.over;
          const unders = odds.data.game.under;
          const keyTotal = odds.data.game.mainTotal;
          const homeTeam = homeMLs[0].participantID;
          const awayTeam = awayMLs[0].participantID;
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
          const MLsAlreadyBet = noReseedMLs(homeMLs, awayMLs, id);
          const SpreadsAlreadyBet = noReseedSpreads(
            homeSpreads,
            awaySpreads,
            id,
            mainHomeSpread,
            mainAwaySpread
          );
          const TotalsAlreadyBet = noReseedTotals(overs, unders, id, keyTotal);
          if (!MLsAlreadyBet.length) {
            const homeOdds = ML.home;
            const awayOdds = ML.away;
            const type = "moneyline";
            const MLorders = properOrders(
              type,
              null,
              gameID,
              homeTeam,
              awayTeam,
              betAmount,
              awayOdds,
              homeOdds,
              username
            );
            await placeOrders(gameID, MLorders, token, url);
          } else {
            console.log("Already Seeded ML or nothing to Seed");
          }
          if (mainSpread && !SpreadsAlreadyBet.length) {
            const type = "spread";
            const spreadOrders = constructSpreadOrders(
              mainSpread,
              altSpread1,
              altSpread2,
              type,
              gameID,
              homeTeam,
              awayTeam,
              betAmount,
              username
            );
            await placeOrders(gameID, spreadOrders, token, url);
          } else {
            console.log("Already Seeded Spread or nothing to Seed");
          }
          if (mainTotal && !TotalsAlreadyBet.length) {
            const type = "total";
            const overSide = "under";
            const underSide = "over";
            const totalOrders = constructTotalOrders(
              mainTotal,
              altTotal1,
              altTotal2,
              type,
              gameID,
              overSide,
              underSide,
              betAmount,
              username
            );
            await placeOrders(gameID, totalOrders, token, url);
          } else {
            console.log("Already Seeded Total or nothing to Seed");
          }
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