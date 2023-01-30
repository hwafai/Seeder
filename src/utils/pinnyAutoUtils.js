const { pinnyExample } = require("../../altExample");
const { properOrders, concatOrders, noReseedMLs, noReseedSpreads, noReseedTotals } = require("./seederUtils");

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

function findTeams(teams) {
    let homeTeam = '';
    let awayTeam = '';
    teams.forEach(team => {
      if (team.homeAway === 'home') {
        homeTeam = team.id;
      } else if (team.homeAway === 'away') {
        awayTeam = team.id;
      }
    });
    return { homeTeam, awayTeam };
}

function Igot(game, league, id) {
    const teams = game.participants;
    const {homeTeam, awayTeam} = findTeams(teams)
    const homeMLs = game.homeMoneylines;
    const awayMLs = game.awayMoneylines;
    const homeSpreads = game.homeSpreads;
    const awaySpreads = game.awaySpreads;
    const mainHomeSpread = game.mainHomeSpread;
    const mainAwaySpread = game.mainAwaySpread;
    const overs = game.over;
    const unders = game.under;
    const keyTotal = game.mainTotal;
    const MLsAlreadyBet = noReseedMLs(homeMLs, awayMLs, id)
    if (league === "NBA" || league === "NFL" || league === "NCAAB") {    
        const SpreadsAlreadyBet = noReseedSpreads(homeSpreads, awaySpreads, id, mainHomeSpread, mainAwaySpread)
        const TotalsAlreadyBet = noReseedTotals(overs, unders, id, keyTotal)    
        return {
            homeTeam,
            awayTeam,
            MLsAlreadyBet,
            SpreadsAlreadyBet,
            TotalsAlreadyBet,
        }
    } else {
        return { homeTeam, awayTeam, MLsAlreadyBet }
    }
}

function constructOrders(MLsAlreadyBet, SpreadsAlreadyBet, TotalsAlreadyBet, ML, mainSpread, altSpread1, altSpread2, mainTotal, altTotal1, altTotal2, gameID, homeTeam, awayTeam, betAmount, username) {
    let orders = [];
    if (!MLsAlreadyBet.length) {
        const type = 'moneyline';
        const MLorders = properOrders(
            type,
            null,
            gameID,
            homeTeam,
            awayTeam,
            betAmount,
            ML.away,
            ML.home,
            username
        );
        orders = orders.concat(MLorders);
    } else {
        console.log("Already Seeded ML or nothing to Seed")
    }
    if (SpreadsAlreadyBet && !SpreadsAlreadyBet.length) {
        const type = "spread"
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
        orders = orders.concat(spreadOrders)
    } else {
        console.log("Already Seeded Spread or nothing to Seed")
    }
    if (TotalsAlreadyBet && !TotalsAlreadyBet.length) {
        const type = "total"
        const overSide = "under"
        const underSide = "over"
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
        orders = orders.concat(totalOrders)
    } else {
        console.log("Already Seeded Totals or nothing to Seed")
    }
    return orders
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
  Igot,
  constructOrders,
};