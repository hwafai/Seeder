const {userVigMap } = require("../utils/vigUtils")
const {
  properOrders,
  concatOrders,
  noReseedMLs,
  noReseedSpreads,
  noReseedTotals,
  getTimeKey,
} = require("./seederUtils");

function fetchML(moneylines) {
  if (moneylines && moneylines.length) {
    const ML = {
      home: addLean(moneylines[0].odds, 1),
      away: addLean(moneylines[1].odds, 1),
    };
    return ML;
  } else {
    const ML = null;
    return ML;
  }
}

function fetchSpreads(eventOdds, homeMainSpread) {
  if (homeMainSpread && eventOdds["spreads"].length) {
    const mainSpread = {
      hdp: homeMainSpread,
      home: addLean(eventOdds["spreads"][0].odds, 1),
      away: addLean(eventOdds["spreads"][1].odds, 1),
    };
    const { spread1, spread2 } = getAlternativeSpreads(homeMainSpread);
    const awaySpread1 = -1 * spread1;
    const awaySpread2 = -1 * spread2;
    if (eventOdds.homeSpreads[spread1]) {
      const altSpread1 = {
        hdp: spread1,
        home: addLean(eventOdds.homeSpreads[spread1][0].odds, -2),
        away: addLean(eventOdds.awaySpreads[awaySpread1][0].odds, -2),
      };
      const altSpread2 = {
        hdp: spread2,
        home: addLean(eventOdds.homeSpreads[spread2][0].odds, -2),
        away: addLean(eventOdds.awaySpreads[awaySpread2][0].odds, -2),
      };
      return { mainSpread, altSpread1, altSpread2 };
    } else {
      const altSpread1 = null;
      const altSpread2 = null;
      return { mainSpread, altSpread1, altSpread2 };
    }
  } else {
    const mainSpread = null;
    const altSpread1 = null;
    const altSpread2 = null;
    return { mainSpread, altSpread1, altSpread2 };
  }
}

function fetchTotals(eventOdds, keyTotal) {
  if (keyTotal && eventOdds["totals"].length) {
    const mainTotal = {
      points: keyTotal,
      over: addLean(eventOdds["totals"][1].odds, 1),
      under: addLean(eventOdds["totals"][0].odds, 1),
    };
    const { total1, total2 } = getAlternativeTotals(keyTotal);
    if (eventOdds.over[total1]) {
      const altTotal1 = {
        points: total1,
        over: addLean(eventOdds.over[total1][0].odds, -2),
        under: addLean(eventOdds.under[total1][0].odds, -2),
      };
      const altTotal2 = {
        points: total2,
        over: addLean(eventOdds.over[total2][0].odds, -2),
        under: addLean(eventOdds.under[total2][0].odds, -2),
      };
      return { mainTotal, altTotal1, altTotal2 };
    } else {
      const altTotal1 = null;
      const altTotal2 = null;
      return { mainTotal, altTotal1, altTotal2 };
    }
  } else {
    const mainTotal = null;
    const altTotal1 = null;
    const altTotal2 = null;
    return { mainTotal, altTotal1, altTotal2 };
  }
}

function fetchOdds(league, eventOdds) {
  // const MLlimit = eventOdds.maxMoneyline,
  // const spreadLimit = eventOdds.maxSpread,
  // const totalLimit = eventOdds.maxTotal,
  // may need to get home and way moneylines
  const moneylines = eventOdds.moneylines;
  const homeMainSpread = eventOdds.mainSpread;
  const keyTotal = eventOdds.mainTotal;
  const ML = fetchML(moneylines);
  const { mainSpread, altSpread1, altSpread2 } = fetchSpreads(
    eventOdds,
    homeMainSpread
  );
  const { mainTotal, altTotal1, altTotal2 } = fetchTotals(eventOdds, keyTotal);
  // key for main spread, do not know if they have
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

function addLean(americanOdds, lean) {
  let leanCopy = lean;
  if (!leanCopy) {
    leanCopy = -1;
  }
  const leanedOdds = parseFloat(americanOdds) + parseFloat(leanCopy);
  if (Math.abs(leanedOdds) >= 100) {
    return leanedOdds;
  }
  if (Math.sign(americanOdds) > 0 && Math.abs(leanedOdds) < 100) {
    // odds are positive
    return leanedOdds - 200;
  }
  if (Math.sign(americanOdds) < 0 && Math.abs(leanedOdds) < 100) {
    return 200 + leanedOdds;
  }
}

function getAlternativeSpreads(homeMainSpread) {
  if (Math.abs(homeMainSpread) < 1.1) {
    if (homeMainSpread > 0) {
      const spread1 = homeMainSpread + 0.5;
      const spread2 = -1 * homeMainSpread;
      return { spread1, spread2 };
    } else if (homeMainSpread < 0) {
      const spread1 = homeMainSpread - 0.5;
      const spread2 = -1 * homeMainSpread;
      return { spread1, spread2 };
    } else if ((homeMainSpread = 0)) {
      const spread1 = 1;
      const spread2 = -1;
      return { spread1, spread2 };
    }
  } else {
    const spread1 = homeMainSpread + 0.5;
    const spread2 = homeMainSpread - 0.5;
    return { spread1, spread2 };
  }
}

function getAlternativeTotals(keyTotal) {
  const total1 = keyTotal + 0.5;
  const total2 = keyTotal - 0.5;
  return { total1, total2 };
}

function findRotNum(participants) {
  for (const participant of participants) {
    if (participant.homeAway === "away") {
      return participant.rotationNumber;
    }
  }
}

function findEvent(game, events) {
  const participants = game.participants;
  const visitorRotNum = findRotNum(participants);
  if (events) {
    for (const event of events) {
      if (event.awayRotationNumber == visitorRotNum) {
        const eventOdds = event;
        return eventOdds;
      }
    }
  } else {
    return null;
  }
}

function findTeams(teams) {
  let homeTeam = "";
  let awayTeam = "";
  teams.forEach((team) => {
    if (team.homeAway === "home") {
      homeTeam = team.id;
    } else if (team.homeAway === "away") {
      awayTeam = team.id;
    }
  });
  return { homeTeam, awayTeam };
}

function ifReseed(game, league, id, eventOdds) {
  const teams = game.participants;
  const { homeTeam, awayTeam } = findTeams(teams);
  const homeMLs = game.homeMoneylines;
  const awayMLs = game.awayMoneylines;
  const homeSpreads = game.homeSpreads;
  const awaySpreads = game.awaySpreads;
  const mainHomeSpread = eventOdds.mainSpread;
  const mainAwaySpread = mainHomeSpread * -1;
  const overs = game.over;
  const unders = game.under;
  const keyTotal = eventOdds.mainTotal;
  const MLsAlreadyBet = noReseedMLs(homeMLs, awayMLs, id);
  if (league === "NBA" || league === "NFL" || league === "NCAAB") {
    const homeMain = homeSpreads[mainHomeSpread];
    const awayMain = awaySpreads[mainAwaySpread];
    const SpreadsAlreadyBet = noReseedSpreads(homeMain, awayMain, id);
    // console.log({SpreadsAlreadyBet})
    const overMain = overs[keyTotal];
    const underMain = unders[keyTotal];
    const TotalsAlreadyBet = noReseedTotals(overMain, underMain, id);
    // console.log({TotalsAlreadyBet})
    return {
      homeTeam,
      awayTeam,
      MLsAlreadyBet,
      SpreadsAlreadyBet,
      TotalsAlreadyBet,
    };
  } else {
    return { homeTeam, awayTeam, MLsAlreadyBet };
  }
}

function findOffered(offers, id, seedAmount) {
  let toEdit = []
  for (const offer of offers) {
    if (offer.createdBy === id) {
      const sessionID = offer.id
      toEdit.push({sessionID, seedAmount})
    }
  }
  return toEdit
}

function gatherAltEdits(games, id, seedAmount) {
  let Alts = []
  const { awaySpreads, homeSpreads, over, under } = games[0];
  const awaySpreadToEdit = findOffered(awaySpreads, id, seedAmount)
  const homeSpreadToEdit = findOffered(homeSpreads, id, seedAmount)
  const oversToEdit = findOffered(over, id, seedAmount)
  const undersToEdit = findOffered(under, id, seedAmount)
  Alts = Alts.concat(awaySpreadToEdit, homeSpreadToEdit, oversToEdit, undersToEdit)
  return Alts
}


function triggeredReseed(AlreadyBet, loadedGame, league, username) {
  const { timeToStart } = loadedGame;
  const timeKey = getTimeKey(timeToStart);
  const { seedAmount } = userVigMap[username][league][timeKey]
  const toBeEdited = []
  for (const currentOrder of AlreadyBet) {
    if (currentOrder.bet < (.98 * seedAmount)) {
      const sessionID = currentOrder.id
      const editedObject = { sessionID, seedAmount}
      toBeEdited.push(editedObject)
    }
  }
  return toBeEdited
}

function getTheGoods(Alts, editedOrders) {
  const ordersToEdit = [...editedOrders, ...Alts.filter(({sessionID}) => !new Set(editedOrders.map(({sessionID}) => sessionID)).has(sessionID))];
  return ordersToEdit
}

async function constructOrders(
  league,
  username,
  loadedGame,
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
) {
  let editedOrders = [];
  let orders = [];
  // console.log({MLsAlreadyBet})
  if (ML && MLsAlreadyBet && !MLsAlreadyBet.length) {
    const type = "moneyline";
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
  } else if (MLsAlreadyBet && MLsAlreadyBet.length) {
    const toBeEdited = triggeredReseed(MLsAlreadyBet, loadedGame, league, username);
    editedOrders = editedOrders.concat(toBeEdited)
    // console.log("Already Seeded ML or nothing to Seed");
  }
  // console.log({SpreadsAlreadyBet})
  if (mainSpread && SpreadsAlreadyBet && !SpreadsAlreadyBet.length) {
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
    orders = orders.concat(spreadOrders);
  } else if (SpreadsAlreadyBet && SpreadsAlreadyBet.length) {
    const toBeEdited = triggeredReseed(SpreadsAlreadyBet, loadedGame, league, username);
    editedOrders = editedOrders.concat(toBeEdited)
    // console.log("Already Seeded Spread or nothing to Seed");
  }
  // console.log({TotalsAlreadyBet})
  if (mainTotal && TotalsAlreadyBet && !TotalsAlreadyBet.length) {
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
    orders = orders.concat(totalOrders);
  } else if (TotalsAlreadyBet && TotalsAlreadyBet.length) {
    const toBeEdited = triggeredReseed(TotalsAlreadyBet, loadedGame, league, username);
    editedOrders = editedOrders.concat(toBeEdited)
    // console.log("Already Seeded Totals or nothing to Seed");
  }
  return {orders, editedOrders};
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
  if (altTotal1 && altTotal2) {
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
  } else {
    return mainTotalOrders;
  }
}

function triggerCancels(
  SpreadsAlreadyBet,
  mainSpread,
  TotalsAlreadyBet,
  mainTotal,
  orderBook,
  id
) {
  let cancelSpread;
  let cancelTotal;
  const SpreadsAlready = [];
  const TotalsAlready = [];
  const awaySpreads = orderBook[0].awaySpreads;
  const homeSpreads = orderBook[0].homeSpreads;
  for (const awaySp of awaySpreads) {
    if (awaySp.createdBy === id) {
      SpreadsAlready.push(awaySp);
    }
  }
  for (const homeSp of homeSpreads) {
    if (homeSp.createdBy === id) {
      SpreadsAlready.push(homeSp);
    }
  }
  const overs = orderBook[0].over;
  const unders = orderBook[0].under;
  for (const over of overs) {
    if (over.createdBy === id) {
      TotalsAlready.push(over);
    }
  }
  for (const under of unders) {
    if (under.createdBy === id) {
      TotalsAlready.push(under);
    }
  }
  if (SpreadsAlready.length && mainSpread && !SpreadsAlreadyBet.length) {
    cancelSpread = true;
  } else {
    cancelSpread = false;
  }
  if (TotalsAlready.length && mainTotal && !TotalsAlreadyBet.length) {
    cancelTotal = true;
  } else {
    cancelTotal = false;
  }
  return { cancelSpread, cancelTotal };
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
  if (altSpread1 && altSpread2) {
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
  } else {
    return mainSpreadOrders;
  }
}

module.exports = {
  fetchOdds,
  ifReseed,
  findEvent,
  triggerCancels,
  getTheGoods,
  gatherAltEdits,
  constructOrders,
};
