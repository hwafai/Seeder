const { getSingleOrderbook, getGames, placeOrders } = require("../utils/apiUtils");
const {
  noReseedMLs,
  bestBet,
  getInitialSeedAmount,
  properOrders,
  timeToSeed,
} = require("../utils/seederUtils");

async function FedExAutoSeed(url, token, id, league, username) {
  const games = await getGames(league, token, url);
  const actuals = games.data.games;
  const ready = timeToSeed(actuals, league);
  if (ready.length) {
    for (const gameID of ready) {
      const odds = await getSingleOrderbook(gameID, url, token);
      const game = odds.data.game;
      const eventName = game.eventName;
      const homeMLs = game.homeMoneylines;
      const awayMLs = game.awayMoneylines;
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
    }
  } else {
    console.log("No", league, "games to Seed");
  }
}

module.exports = {
  FedExAutoSeed,
};
