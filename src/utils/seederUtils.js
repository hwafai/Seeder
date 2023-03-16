const _ = require("lodash");

function convertToDecimal(otherSide) {
  const newBase = otherSide / (1 - otherSide) + 1;
  return newBase;
}

function convertToPercent(price) {
  if (price > 0) {
    const percentOfBet = 1 / (price + 1);
    return percentOfBet;
  } else {
    price = Math.abs(price);
    const percentOfBet = price / (price + 1);
    return percentOfBet;
  }
}

function leagueWhenSeed(league) {
  if (league === "NFL") {
    const thresholdTime = 2000000000;
    return thresholdTime;
  } else if (league === "NBA" || league === "NCAAB" || league === "NHL") {
    const thresholdTime = 18000;
    return thresholdTime;
  } else if (league === "CHAMPIONS-LEAGUE") {
    const thresholdTime = 86400;
    return thresholdTime;
  } else if (league === "NHL" || league === "FED-EX-500") {
    const thresholdTime = 86400;
    return thresholdTime;
  } else if (
    league === "ROUND-1-FED-EX-500" ||
    league === "ROUND-2-FED-EX-500" ||
    league === "ROUND-3-FED-EX-500" ||
    league === "ROUND-4-FED-EX-500"
  ) {
    const thresholdTime = 18000;
    return thresholdTime;
  } else if (league === "ATP" || league === "WTA") {
    const thresholdTime = 10800;
    return thresholdTime;
  } else if (league === "2H-NBA" || league === "2H-NCAAB") {
    const thresholdTime = 420;
    return thresholdTime;
  } else {
    const thresholdTime = 1800;
    return thresholdTime;
  }
}

function timeToSeed(games, league) {
  const thresholdTime = leagueWhenSeed(league);
  const ready = [];
  // hala is arabic for right now
  const hala = new Date();
  for (const game of games) {
    const start = new Date(game.start);
    const timeToStart = (start - hala) / 1000;
    if (timeToStart < thresholdTime && timeToStart > 0) {
      const gameID = game.id;
      ready.push({ gameID, timeToStart });
    }
  }
  return ready;
}

function getBestSpreadOdds(homeSpreads, awaySpreads) {
  let homeSpreadOdds = -10000;
  let awaySpreadOdds = -10000;
  for (const home of homeSpreads) {
    if (home.odds > homeSpreadOdds) {
      homeSpreadOdds = home.odds;
    }
  }
  for (const away of awaySpreads) {
    if (away.odds > awaySpreadOdds) {
      awaySpreadOdds = away.odds;
    }
  }
  return { homeSpreadOdds, awaySpreadOdds };
}

function getBestTotalsOdds(overs, unders) {
  let overOdds = -10000;
  let underOdds = -10000;
  for (const over of overs) {
    if (over.odds > overOdds) {
      overOdds = over.odds;
    }
  }
  for (const under of unders) {
    if (under.odds > underOdds) {
      underOdds = under.odds;
    }
  }
  return { overOdds, underOdds };
}

function adjustedSpreadOrders(
  type,
  homeSpreadKeys,
  awaySpreadKeys,
  spreadHome,
  spreadAway,
  homeMainSp,
  betAmount,
  homeTeam,
  awayTeam,
  gameID,
  username
) {
  const adjOrders = [];
  for (const key of homeSpreadKeys) {
    const HSP = _.toString(homeMainSp);
    if (key !== HSP) {
      const adjHomeSpread = spreadHome[key];
      const number = key;
      const x = -1 * number;
      const y = _.toString(x);
      for (const awayKey of awaySpreadKeys) {
        if (y === awayKey) {
          const adjAwaySpread = spreadAway[awayKey];
          const { homeSpreadOdds, awaySpreadOdds } = getBestSpreadOdds(
            adjHomeSpread,
            adjAwaySpread
          );
          const adjOdds = bestBet(awaySpreadOdds, homeSpreadOdds);
          const adjustedSpreadOrders = properOrders(
            type,
            number,
            gameID,
            homeTeam,
            awayTeam,
            betAmount,
            adjOdds.newOdds1,
            adjOdds.newOdds2,
            username
          );
          adjOrders.push(adjustedSpreadOrders);
        }
      }
    }
  }
  return adjOrders;
}

function adjustedTotalOrders(
  type,
  overKeys,
  underKeys,
  oversOrders,
  undersOrders,
  mainTotal,
  betAmount,
  overSide,
  underSide,
  gameID,
  username
) {
  const adjOrders = [];
  for (const key of overKeys) {
    const MT = _.toString(mainTotal);
    if (key !== MT) {
      const adjOver = oversOrders[key];
      const number = key;
      for (const unKey of underKeys) {
        if (key === unKey) {
          const adjUnder = undersOrders[unKey];
          const { overOdds, underOdds } = getBestTotalsOdds(adjOver, adjUnder);
          const adjOdds = bestBet(overOdds, underOdds);
          const adjustedTotalOrders = properOrders(
            type,
            number,
            gameID,
            overSide,
            underSide,
            betAmount,
            adjOdds.newOdds1,
            adjOdds.newOdds2,
            username
          );
          adjOrders.push(adjustedTotalOrders);
        }
      }
    }
  }
  return adjOrders;
}

function concatOrders(spreadOrders, adjOrders) {
  if (!adjOrders.length) {
    const orders = spreadOrders;
    return orders;
  } else {
    let orders = [...spreadOrders];
    for (let i = 0; i < adjOrders.length; i++) {
      orders = [...orders, ...adjOrders[i]];
    }
    return orders;
  }
}

function homeAway(participants, side1, type) {
  if (type === "moneyline") {
    return;
  } else if (type === "total") {
    return side1;
  } else if (type === "spread") {
    for (const part of participants) {
      if (part.id === side1) {
        return part.homeAway;
      }
    }
  }
}

function eligibleToReseed(orderBook, type, id, number, teamSide) {
  const toReseed = [];
  if (type === "moneyline") {
    return toReseed;
  } else if (type === "spread") {
    const trueNum = -1 * number;
    if (teamSide === "home") {
      const spreadAway = orderBook.data.game.awaySpreads;
      const awaySpreadKeys = Object.keys(spreadAway);
      for (const key of awaySpreadKeys) {
        const stringNumber = trueNum.toString();
        if (key !== stringNumber) {
          const keyOrders = spreadAway[key];
          for (const order of keyOrders) {
            if (order.createdBy === id) {
              const odds = order.odds;
              toReseed.push({ key, odds });
            }
          }
        }
      }
      return toReseed;
    }
    if (teamSide === "away") {
      const spreadHome = orderBook.data.game.homeSpreads;
      const homeSpreadKeys = Object.keys(spreadHome);
      for (const key of homeSpreadKeys) {
        const stringNumber = trueNum.toString();
        if (key !== stringNumber) {
          const keyOrders = spreadHome[key];
          for (const order of keyOrders) {
            if (order.createdBy === id) {
              const odds = order.odds;
              toReseed.push({ key, odds });
            }
          }
        }
      }
      return toReseed;
    }
  } else if (type === "total") {
    if (teamSide === "over") {
      const undersOrders = orderBook.data.game.under;
      const underKeys = Object.keys(undersOrders);
      for (const key of underKeys) {
        if (key !== number) {
          const underKeyOrders = undersOrders[key];
          for (const order of underKeyOrders) {
            if (order.createdBy === id) {
              const odds = order.odds;
              toReseed.push({ key, odds });
            }
          }
        }
      }
      return toReseed;
    }
    if (teamSide === "under") {
      const oversOrders = orderBook.data.game.over;
      const overKeys = Object.keys(oversOrders);
      for (const key of overKeys) {
        if (key !== number) {
          const overKeyOrders = oversOrders[key];
          for (const order of overKeyOrders) {
            if (order.createdBy === id) {
              const odds = order.odds;
              toReseed.push({ key, odds });
            }
          }
        }
      }
      return toReseed;
    }
  }
}

function getNumber(type, reseed) {
  if (type === "spread") {
    const takenNumber = reseed.key;
    const number = takenNumber * -1;
    return number;
  } else if (type === "total") {
    const number = reseed.key;
    return number;
  }
}

function constructReseedOrders(
  toReseed,
  desiredVig,
  equityToLockIn,
  type,
  gameID,
  side1,
  side2,
  seedAmount,
  username
) {
  const ordersToReseed = [];
  for (const reseed of toReseed) {
    const takenOdds = reseed.odds;
    const odds = takenOdds * -1;
    const number = getNumber(type, reseed);
    const { newSeedA, secondNewA } = newSeeds(
      type,
      odds,
      desiredVig,
      equityToLockIn
    );
    const adjOrders = properOrders(
      type,
      number,
      gameID,
      side1,
      side2,
      seedAmount,
      newSeedA,
      secondNewA,
      username
    );
    ordersToReseed.push(adjOrders);
  }
  return ordersToReseed;
}

function bestBet(odds1, odds2) {
  if (odds1 < 0 && odds2 < 0) {
    const cents = odds1 + 100 + (odds2 + 100);
    if (cents > -5) {
      const newOdds1 = odds1;
      const newOdds2 = odds2;
      return { newOdds1, newOdds2 };
    } else {
      const newOdds1 = odds1 + 1;
      const newOdds2 = odds2 + 1;
      return { newOdds1, newOdds2 };
    }
  } else {
    if (odds1 < -150 || odds1 > 150 || odds2 < -150 || odds2 > 150) {
      const cents = odds1 + odds2;
      if (cents < 9 && cents > -9) {
        const newOdds1 = odds1;
        const newOdds2 = odds2;
        return { newOdds1, newOdds2 };
      } else {
        const newOdds1 = odds1 + 1;
        const newOdds2 = odds2 + 1;
        return { newOdds1, newOdds2 };
      }
    } else {
      const cents = odds1 + odds2;
      if (cents < 5 && cents > -5) {
        const newOdds1 = odds1;
        const newOdds2 = odds2;
        return { newOdds1, newOdds2 };
      } else {
        const newOdds1 = odds1 + 1;
        const newOdds2 = odds2 + 1;
        return { newOdds1, newOdds2 };
      }
    }
  }
}

function getInitialSeedAmount(league) {
  if (league === "NFL") {
    const betAmount = 250;
    return betAmount;
  } else if (league === "NBA") {
    const betAmount = 100;
    return betAmount;
  } else if (league === "ATP") {
    const betAmount = 250;
    return betAmount;
  } else if (league === "WTA") {
    const betAmount = 200;
    return betAmount;
  } else if (league === "FED-EX-500") {
    const betAmount = 250;
    return betAmount;
  } else if (
    league === "ROUND-1-FED-EX-500" ||
    league === "ROUND-2-FED-EX-500" ||
    league === "ROUND-3-FED-EX-500" ||
    league === "ROUND-4-FED-EX-500"
  ) {
    const betAmount = 200;
    return betAmount;
  } else if (league === "2H-NBA" || league === "2H-NCAAB") {
    const betAmount = 100;
    return betAmount;
  } else if (league === "NCAAB") {
    const betAmount = 100;
    return betAmount;
  } else if (league === "NHL") {
    const betAmount = 200;
    return betAmount;
  } else if (league === "CHAMPIONS-LEAGUE") {
    const betAmount = 200;
    return betAmount;
  }
}

function getMaxLiability(league, username) {
  if (username === "mongoose") {
    const maxLiability = -10000;
    return maxLiability;
  } else {
    if (league === "NFL") {
      const maxLiability = -3500;
      return maxLiability;
    } else if (league === "NBA") {
      const maxLiability = -1500;
      return maxLiability;
    } else if (league === "NCAAB") {
      const maxLiability = -1250;
      return maxLiability;
    } else if (league === "ATP") {
      const maxLiability = -1500;
      return maxLiability;
    } else if (league === "WTA") {
      const maxLiability = -750;
      return maxLiability;
    } else {
      const maxLiability = -1000;
      return maxLiability;
    }
  }
}

function noReseedMLs(homeMLs, awayMLs, id) {
  const MLsAlreadyBet = [];
  for (const bet of homeMLs) {
    if (bet.createdBy === id) {
      MLsAlreadyBet.push(bet);
    }
  }
  for (const bet of awayMLs) {
    if (bet.createdBy === id) {
      MLsAlreadyBet.push(bet);
    }
  }
  return MLsAlreadyBet;
}

function noReseedSpreads(homeMain, awayMain, id) {
  const SpreadsAlreadyBet = [];
  if (homeMain && awayMain) {
    for (const homeSP of homeMain) {
      if (homeSP.createdBy === id) {
        SpreadsAlreadyBet.push(homeSP);
      }
    }
    for (const awaySP of awayMain) {
      if (awaySP.createdBy === id) {
        SpreadsAlreadyBet.push(awaySP);
      }
    }
    return SpreadsAlreadyBet;
  } else {
    return SpreadsAlreadyBet;
  }
}

function noReseedTotals(overMain, underMain, id) {
  const TotalsAlreadyBet = [];
  if (overMain && underMain) {
    for (const over of overMain) {
      if (over.createdBy === id) {
        TotalsAlreadyBet.push(over);
      }
    }
    for (const under of underMain) {
      if (under.createdBy === id) {
        TotalsAlreadyBet.push(under);
      }
    }
    return TotalsAlreadyBet;
  } else {
    return TotalsAlreadyBet;
  }
}

function convertDecimalToAmerican(decimalOdds) {
  if (parseFloat(decimalOdds) > 101) {
    return 10000;
  }
  if (parseFloat(decimalOdds) === 2) {
    return -100;
  }
  if (parseFloat(decimalOdds) > 2.0) {
    return (decimalOdds - 1) * 100;
  }
  return -100 / (decimalOdds - 1);
}

function findOtherSide(participants, orderSide, type) {
  if (type === "moneyline" || type === "spread") {
    const participantIds = participants.map((p) => p.id);
    return participantIds.find((pId) => pId !== orderSide);
  }
  return ["over", "under"].find((side) => side !== orderSide);
}

function filterIfPGA(actuals, league) {
  let partidos;
  if (
    league !== "FED-EX-500" &&
    league !== "ROUND-1-FED-EX-500" &&
    league !== "ROUND-2-FED-EX-500" &&
    league !== "ROUND-3-FED-EX-500" &&
    league !== "ROUND-4-FED-EX-500"
  ) {
    partidos = actuals;
    return actuals;
  } else {
    const events = [];
    for (const actual of actuals) {
      if (actual.league === league) {
        events.push(actual);
      }
    }
    partidos = events;
  }
  return partidos;
}

function getTimeKey(timeToStart) {
  if (timeToStart > 86400) {
    const timeKey = 86400;
    return timeKey;
  } else if (timeToStart < 86400 && timeToStart > 10800) {
    const timeKey = 10800;
    return timeKey;
  } else if (timeToStart < 10800 && timeToStart > 1800) {
    const timeKey = 1800;
    return timeKey;
  } else if (timeToStart < 1800 && timeToStart > 0) {
    const timeKey = 0;
    return timeKey;
  }
}

function userOrderType(username) {
  if (username === "zp4") {
    const orderType = "post";
    return orderType;
  } else {
    const orderType = "limit";
    return orderType;
  }
}

function properOrders(
  type,
  number,
  gameID,
  side1,
  side2,
  seedAmount,
  newSeedA,
  secondNewA,
  username
) {
  const orderType = userOrderType(username);
  const firstOrder = {
    gameID,
    type,
    side: side1,
    bet: seedAmount,
    odds: -1 * newSeedA,
    expirationMinutes: 0,
    orderType: orderType,
  };
  const comebackOrders = {
    gameID,
    type,
    side: side2,
    bet: seedAmount,
    odds: -1 * secondNewA,
    expirationMinutes: 0,
    orderType: orderType,
  };
  if (type === "spread") {
    firstOrder.number = number;
    const secondNumber = -1 * number;
    comebackOrders.number = secondNumber;
  } else if (type === "total") {
    firstOrder.number = number;
    comebackOrders.number = number;
  }
  return [firstOrder, comebackOrders];
}

function altExposure(roundedA, roundedB, type) {
  if (type === "moneyline") {
    const newSeedA = roundedA;
    const secondNewA = roundedB;
    return { newSeedA, secondNewA };
  } else if (type === "spread" || type === "total") {
    let newSeedA = roundedA;
    let secondNewA = roundedB;
    if (roundedA > 104) {
      newSeedA = 104;
    }
    if (roundedB > 104) {
      secondNewA = 104;
    }
    return { newSeedA, secondNewA };
  }
}

// equityToLockIn must be lower than desiredVig
function newSeeds(type, odds, desiredVig, equityToLockIn) {
  const priceMove = desiredVig - equityToLockIn;
  const price = -1 * (odds / 100);
  const percentOfBet = convertToPercent(price);
  const otherSide = percentOfBet + priceMove;
  if (priceMove === 0) {
    throw new Error("Will seed at same price");
  } else {
    const secondSeed = 1 + desiredVig - otherSide;
    const newSeed = convertToDecimal(otherSide);
    const secondNew = convertToDecimal(secondSeed);
    const roundedA = -1 * Math.round(convertDecimalToAmerican(newSeed));
    const roundedB = -1 * Math.round(convertDecimalToAmerican(secondNew));
    const { newSeedA, secondNewA } = altExposure(roundedA, roundedB, type);
    return { newSeedA, secondNewA };
  }
}

// const leagues = ["NBA", "NCAAB", "ATP", "WTA", "NHL", "CHAMPIONS-LEAGUE", "FED-EX-500", "ROUND-1-FED-EX-500", "ROUND-2-FED-EX-500", "ROUND-3-FED-EX-500", "ROUND-4-FED-EX-500", "2H-NBA", "2H-NCAAB"];
const leagues = ["NCAAB"];
module.exports = {
  convertToDecimal,
  convertToPercent,
  timeToSeed,
  getBestSpreadOdds,
  getBestTotalsOdds,
  adjustedSpreadOrders,
  adjustedTotalOrders,
  eligibleToReseed,
  constructReseedOrders,
  concatOrders,
  homeAway,
  bestBet,
  getTimeKey,
  getInitialSeedAmount,
  getMaxLiability,
  noReseedMLs,
  noReseedSpreads,
  altExposure,
  noReseedTotals,
  convertDecimalToAmerican,
  findOtherSide,
  newSeeds,
  properOrders,
  filterIfPGA,
  leagues,
};
