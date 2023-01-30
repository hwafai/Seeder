const { pinnyExample } = require("../../altExample");
const { properOrders, concatOrders } = require("./seederUtils");

function whatYouNeed(league) {
  const ML = pinnyExample["moneyline"];
  const mainSpread = pinnyExample["spreads"][0];
  const altSpread1 = pinnyExample["spreads"][5];
  const altSpread2 = pinnyExample["spreads"][6];
  const mainTotal = pinnyExample["totals"][0];
  const altTotal1 = pinnyExample["totals"][5];
  const altTotal2 = pinnyExample["totals"][6];
  if (league === "NBA" || league || "NFL" || league === "NCAAB") {
    return {
      ML,
      mainSpread,
      altSpread1,
      altSpread2,
      mainTotal,
      altTotal1,
      altTotal2,
    };
  } else {
    return { ML };
  }
}

function constructTotalOrders(
  mainTotal,
  altTotal1,
  altTotal2,
  type,
  gameID,
  overSide,
  underSide,
  betAmount,
  username
) {
  const mainTotalOrders = properOrders(
    type,
    mainTotal.points,
    gameID,
    overSide,
    underSide,
    betAmount,
    mainTotal.over,
    mainTotal.under,
    username
  );
  const altTotals = [];
  const altTotal1Orders = properOrders(
    type,
    altTotal1.points,
    gameID,
    overSide,
    underSide,
    betAmount,
    altTotal1.over,
    altTotal1.under,
    username
  );
  const altTotal2Orders = properOrders(
    type,
    altTotal2.points,
    gameID,
    overSide,
    underSide,
    betAmount,
    altTotal2.over,
    altTotal2.under,
    username
  );
  altTotals.push(altTotal1Orders, altTotal2Orders);
  const totalOrders = concatOrders(mainTotalOrders, altTotals);
  return totalOrders;
}

function constructSpreadOrders(
  mainSpread,
  altSpread1,
  altSpread2,
  type,
  gameID,
  homeTeam,
  awayTeam,
  betAmount,
  username
) {
  const mainSpreadOrders = properOrders(
    type,
    mainSpread.hdp,
    gameID,
    homeTeam,
    awayTeam,
    betAmount,
    mainSpread.away,
    mainSpread.home,
    username
  );
  const altOrders = [];
  const alt1Orders = properOrders(
    type,
    altSpread1.hdp,
    gameID,
    homeTeam,
    awayTeam,
    betAmount,
    altSpread1.away,
    altSpread1.home,
    username
  );
  const alt2Orders = properOrders(
    type,
    altSpread2.hdp,
    gameID,
    homeTeam,
    awayTeam,
    betAmount,
    altSpread2.away,
    altSpread2.home,
    username
  );
  altOrders.push(alt1Orders, alt2Orders);
  const spreadOrders = concatOrders(mainSpreadOrders, altOrders);
  return spreadOrders;
}

module.exports = {
  whatYouNeed,
  constructSpreadOrders,
  constructTotalOrders,
};
