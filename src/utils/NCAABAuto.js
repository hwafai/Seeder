const {
  noReseedMLs,
  noReseedSpreads,
  noReseedTotals,
  bestBet,
  getInitialSeedAmount,
  properOrders,
} = require("./seederUtils");

function NCAABAuto(game, gameID, id, league, username) {
  let orders = [];
  const homeMLs = game.homeMoneylines;
  const awayMLs = game.awayMoneylines;
  const mainHomeSpread = game.mainHomeSpread;
  const MLsAlreadyBet = noReseedMLs(homeMLs, awayMLs, id);
  const mainAwaySpread = game.mainAwaySpread;
  const mainTotal = game.mainTotal;
  const homeSpreads = game.homeSpreads;
  const awaySpreads = game.awaySpreads;
  const overs = game.over;
  const unders = game.under;
  const homeMain = homeSpreads[mainHomeSpread];
  const awayMain = awaySpreads[mainAwaySpread];
  const SpreadsAlreadyBet = noReseedSpreads(homeMain, awayMain, id);
  const overMain = overs[mainTotal];
  const underMain = unders[mainTotal];
  const TotalsAlreadyBet = noReseedTotals(overMain, underMain, id);
  if (homeMLs.length && awayMLs.length && !MLsAlreadyBet.length) {
    const awayOdds = game.awayMoneylines[0].odds;
    const homeOdds = game.homeMoneylines[0].odds;
    const adjOdds = bestBet(awayOdds, homeOdds);
    const type = "moneyline";
    const homeSide = game.homeMoneylines[0].participantID;
    const awaySide = game.awayMoneylines[0].participantID;
    const betAmount = getInitialSeedAmount(league);
    const MLorders = properOrders(
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
    orders = orders.concat(MLorders);
  }
  if (homeMain && awayMain && !SpreadsAlreadyBet.length) {
    const homeOdds = homeMain[0].odds;
    const awayOdds = awayMain[0].odds;
    const type = homeMain[0].type;
    const adjOdds = bestBet(awayOdds, homeOdds);
    const homeSide = homeMain[0].participantID;
    const awaySide = awayMain[0].participantID;
    const betAmount = getInitialSeedAmount(league);
    const spreadOrders = properOrders(
      type,
      mainHomeSpread,
      gameID,
      homeSide,
      awaySide,
      betAmount,
      adjOdds.newOdds1,
      adjOdds.newOdds2,
      username
    );
    orders = orders.concat(spreadOrders);
  }
  if (overMain && underMain && !TotalsAlreadyBet.length) {
    const overOdds = overMain[0].odds;
    const underOdds = underMain[0].odds;
    const type = overMain[0].type;
    const adjOdds = bestBet(overOdds, underOdds);
    const overSide = "under";
    const underSide = "over";
    const betAmount = getInitialSeedAmount(league);
    const totalOrders = properOrders(
      type,
      mainTotal,
      gameID,
      overSide,
      underSide,
      betAmount,
      adjOdds.newOdds1,
      adjOdds.newOdds2,
      username
    );
    orders = orders.concat(totalOrders);
  }
  return orders;
}

module.exports = {
  NCAABAuto,
};
