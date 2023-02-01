const { pinnyExample } = require("../../altExample");
const { properOrders, concatOrders, noReseedMLs, noReseedSpreads, noReseedTotals } = require("./seederUtils");

function whatYouNeed(league, eventOdds) {
  // may need to get home and way moneylines
  const moneylines = eventOdds.moneylines;
  const ML = {
    home: moneylines[0].odds,
    away: moneylines[1].odds
  }
  // key for main spread, do not know if they have
  const homeMainSpread = eventOdds.mainSpread;
  const keyTotal = eventOdds.mainTotal
  const mainSpread = {
    hdp: homeMainSpread,
    home: eventOdds["spreads"][0].odds,
    away: eventOdds["spreads"][1].odds,
  }
  const {spread1, spread2} = getAlternativeSpreads(homeMainSpread)
  // console.log({homeMainSpread})
  // console.log({spread1, spread2})
  const awaySpread1 = -1 * spread1
  const awaySpread2 = -1 * spread2
  const altSpread1 = {
    hdp: spread1,
    home: eventOdds.homeSpreads[spread1][0].odds,
    away: eventOdds.awaySpreads[awaySpread1][0].odds,
  }
  const altSpread2 = {
    hdp: spread2,
    home: eventOdds.homeSpreads[spread2][0].odds,
    away: eventOdds.awaySpreads[awaySpread2][0].odds,
  }
  const mainTotal = {
    points: keyTotal,
    over: eventOdds["totals"][1].odds,
    under: eventOdds["totals"][0].odds,
  }
  const {total1, total2} = getAlternativeTotals(keyTotal)
  const altTotal1 = {
    points: total1,
    over: eventOdds.over[total1][0].odds,
    under: eventOdds.under[total1][0].odds,
  }
  const altTotal2 = {
    points: total2,
    over: eventOdds.over[total2][0].odds,
    under: eventOdds.under[total2][0].odds
  }
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

function getAlternativeSpreads(homeMainSpread) {
  if (Math.abs(homeMainSpread) < 1.1) {
    if (homeMainSpread > 0) {
      const spread1 = homeMainSpread + .5
      const spread2 = -1 * homeMainSpread
      return {spread1, spread2}
    } else if (homeMainSpread < 0) {
      const spread1 = homeMainSpread - .5
      const spread2 = -1 * homeMainSpread
      return {spread1, spread2}
    } else if (homeMainSpread = 0) {
      const spread1 = 1
      const spread2 = -1
      return {spread1, spread2}
    }
  } else {
    const spread1 = homeMainSpread + .5
    const spread2 = homeMainSpread - .5
    return {spread1, spread2}
  }
}

function getAlternativeTotals(keyTotal){
  const total1 = keyTotal + .5
  const total2 = keyTotal - .5
  return {total1, total2}
}

function findEvent(eventName, events) {
  if (events) {
    for (const event of events) {
      if (event.eventName === eventName) {
        const eventOdds = event
        return eventOdds
      }
    }
  } else {
    return null
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

function ifReseed(game, league, id, eventOdds) {
    const teams = game.participants;
    const {homeTeam, awayTeam} = findTeams(teams)
    const homeMLs = game.homeMoneylines;
    const awayMLs = game.awayMoneylines;
    const homeSpreads = game.homeSpreads;
    const awaySpreads = game.awaySpreads;
    const mainHomeSpread = eventOdds.mainSpread;
    const mainAwaySpread = mainHomeSpread * -1;
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
  ifReseed,
  findEvent,
  constructOrders,
};
