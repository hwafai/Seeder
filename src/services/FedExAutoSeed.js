const {
  getSingleOrderbook,
  getGames,
  placeOrders,
} = require("../utils/apiUtils");
const {
  noReseedMLs,
  noReseedSpreads,
  noReseedTotals,
  bestBet,
  getInitialSeedAmount,
  properOrders,
  timeToSeed,
  filterIfPGA,
} = require("../utils/seederUtils");
const { ChampionsLeagueAuto } = require("../utils/championsLeague");
const { NCAABAuto } = require("../utils/NCAABAuto");

async function FedExAutoSeed(url, token, id, league, username) {
  const games = await getGames(league, token, url);
  const actuals = games.data.games;
  console.log({ actuals });
  const partidos = filterIfPGA(actuals, league);
  console.log({ league, partidos });
  const ready = timeToSeed(partidos, league);
  console.log({ ready });
  if (ready.length) {
    for (const loadedGame of ready) {
      try {
        const gameID = loadedGame.gameID;
        const odds = await getSingleOrderbook(gameID, url, token);
        const game = odds.data.game;
        console.log({ game });
        const eventName = game.eventName;
        if (league !== "CHAMPIONS-LEAGUE" && league !== "NCAAB") {
          const homeMLs = game.homeMoneylines;
          const awayMLs = game.awayMoneylines;
          // const homeSpreads = game.homeSpreads;
          // const awaySpreads = game.awaySpreads;
          // const mainHomeSpread = game.mainHomeSpread;
          // const mainAwaySpread = game.mainAwaySpread;
          // const homeMain = homeSpreads[mainHomeSpread];
          // const awayMain = awaySpreads[mainAwaySpread];
          // const SpreadsAlreadyBet = noReseedSpreads(homeMain, awayMain, id)
          // const overs = game.over;
          // const unders = game.under;
          // const mainTotal = game.mainTotal;
          // const overMain = overs[mainTotal];
          // const underMain = unders[mainTotal];
          // const TotalsAlreadyBet = noReseedTotals(overMain, underMain, id);
          const MLsAlreadyBet = noReseedMLs(homeMLs, awayMLs, id);
          if (homeMLs.length && awayMLs.length && !MLsAlreadyBet.length) {
            const awayOdds = game.awayMoneylines[0].odds;
            const homeOdds = game.homeMoneylines[0].odds;
            const adjOdds = bestBet(awayOdds, homeOdds);
            const type = "moneyline";
            const homeSide = game.homeMoneylines[0].participantID;
            const awaySide = game.awayMoneylines[0].participantID;
            const betAmount = getInitialSeedAmount(league);
            const orders = properOrders(
              type,
              null,
              gameID,
              homeSide,
              awaySide,
              betAmount,
              adjOdds.newOdds1,
              adjOdds.newOdds2,
              username
            );
            await placeOrders(gameID, orders, token, url);
          }
        } else if (league === "CHAMPIONS-LEAGUE") {
          const orders = ChampionsLeagueAuto(
            game,
            gameID,
            id,
            league,
            username
          );
          await placeOrders(gameID, orders, token, url);
        } else if (league === "NCAAB") {
          const orders = NCAABAuto(game, gameID, id, league, username);
          await placeOrders(gameID, orders, token, url);
        }
      } catch (error) {
        console.log("Error running FedExAuto Seed");
        console.log(error);
      }
    }
  } else {
    // console.log("No", league, "games to Seed");
  }
}

module.exports = {
  FedExAutoSeed,
};
