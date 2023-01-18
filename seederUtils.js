function convertToDecimal(otherSide) {
  const newBase = otherSide / (1 - otherSide) + 1;
  return newBase;
}

function convertToPercent(price) {
  if (price > 0) {
    const percentOfBet = 1 / (price + 1);
    console.log(percentOfBet);
    return percentOfBet;
  } else {
    price = Math.abs(price);
    const percentOfBet = price / (price + 1);
    return percentOfBet;
  }
}

function leagueWhenSeed (league) {
  if (league === "NFL") {
    const thresholdTime = 86400
    return thresholdTime
  } else if (league === "FED-EX-500") {
    const thresholdTime = 10801
    return thresholdTime
  } else {
    const thresholdTime = 2000
    return thresholdTime
  }
}

function timeToSeed(games, league) {
  const thresholdTime = leagueWhenSeed (league)
  const ready = []
  const hala = new Date()
  for (const game of games) {
    const start = new Date(game.start)
    if (((start - hala)/1000) < thresholdTime && ((start - hala)/ 1000) > 0) {
      ready.push(game.id)
    }
  }
  return ready
}

function bestBet(odds1, odds2) {
  if (odds1 < 0 && odds2 < 0) {
    const cents = ((odds1 + 100) + (odds2 + 100))
    if (cents > -5) {
      const newOdds1 = odds1
      const newOdds2 = odds2
      return {newOdds1, newOdds2}
    } else {
      const newOdds1 = odds1 + 1
      const newOdds2 = odds2 + 1
      return {newOdds1, newOdds2}
    }
  } else {
    if (odds1 < -150 || odds1 > 150 || odds2 < -150 || odds2 > 150) {
      const cents = odds1 + odds2
      if (cents < 9 && cents > -9) {
        const newOdds1 = odds1
        const newOdds2 = odds2
        return {newOdds1, newOdds2}
      } else {
        const newOdds1 = odds1 + 1
        const newOdds2 = odds2 + 1
        return { newOdds1, newOdds2}
      }
    } else {
      const cents = odds1 + odds2
      if (cents < 5 && cents > -5) {
        const newOdds1 = odds1
        const newOdds2 = odds2
        return {newOdds1, newOdds2}
      } else {
        const newOdds1 = odds1 + 1
        const newOdds2 = odds2 + 1
        return {newOdds1, newOdds2}
      }
    }
  }
}

function getInitialSeedAmount(league) {
  if (league === "NFL") {
    const betAmount = 500
    return betAmount
  } else if (league === "NBA") {
    const betAmount = 333
    return betAmount
  } else if (league === "ATP") {
    const betAmount = 200
    return betAmount
  } else if (league === "WTA") {
    const betAmount = 155
    return betAmount
  } else if (league === "FED-EX-500") {
    const betAmount = 200
    return betAmount
  } else if (league === "NCAAB") {
    const betAmount = 100
    return betAmount
  } else if (league === "NHL") {
    const betAmount= 200
    return betAmount
  }
}

function getMaxLiability(league){
  if (league === 'NFL') {
    const maxLiability = -3000
    return maxLiability
  } else if (league === 'NHL') {
    const maxLiability = -750
    return maxLiability
  } else {
    const maxLiability = -1000
    return maxLiability
  }
}

function noReseedMLs(homeMLs, awayMLs, id){
  const MLsAlreadyBet = []
  for (const bet of homeMLs) {
    if (bet.createdBy === id) {
      MLsAlreadyBet.push(bet)
    }
  }
  for (const bet of awayMLs) {
    if (bet.createdBy === id) {
      MLsAlreadyBet.push(bet)
    }
  }
  return MLsAlreadyBet
}

function noReseedSpreads(homeSpreads, awaySpreads, id) {
  const SpreadsAlreadyBet = []
  for (const homeSP of homeSpreads) {
    if (homeSP.createdBy === id) {
      SpreadsAlreadyBet.push(homeSP)
    }
  }
  for (const awaySP of awaySpreads) {
    if (awaySP.createdBy === id) {
      SpreadsAlreadyBet.push(awaySP)
    }
  }
  return SpreadsAlreadyBet
}

function noReseedTotals(overs, unders, id) {
  const TotalsAlreadyBet = []
  for (const over of overs) {
    if (over.createdBy === id) {
      TotalsAlreadyBet.push(over)
    }
  } 
  for (const under of unders) {
    if (under.createdBy === id) {
      TotalsAlreadyBet.push(under)
    }
  }
  return TotalsAlreadyBet
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

function properOrders(
  type,
  number,
  gameID,
  side1,
  side2,
  seedAmount,
  newSeedA,
  secondNewA
) {
  const firstOrder = {
    gameID,
    type,
    side: side1,
    bet: seedAmount,
    odds: -1 * newSeedA,
    expirationMinutes: 0,
  };
  const comebackOrders = {
    gameID,
    type,
    side: side2,
    bet: seedAmount,
    odds: -1 * secondNewA,
    expirationMinutes: 0,
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


function vigMap(league, timeToStart) {
  if (timeToStart < 86400 && timeToStart > 10799 ){
    if (league === "NCAAF") {
      const seedAmount = 200;
      const desiredVig = 0.02;
      const equityToLockIn = 0.0075;
      return { seedAmount, desiredVig, equityToLockIn };
    } else if (league === "PREMIER-LEAGUE") {
      const seedAmount = 200;
      const desiredVig = 0.02;
      const equityToLockIn = 0.0075;
      return { seedAmount, desiredVig, equityToLockIn };
    } else if (league === "NFL") {
      const seedAmount = 500;
      const desiredVig = .015;
      const equityToLockIn = .005;
      return {seedAmount, desiredVig, equityToLockIn}
    } else if (league === "NBA") {
      const seedAmount = 200;
      const desiredVig = .02;
      const equityToLockIn = .0075;
      return {seedAmount, desiredVig, equityToLockIn}
    } else if (league === "FED-EX-500") {
      const seedAmount = 200;
      const desiredVig = .03;
      const equityToLockIn = .01
      return {seedAmount, desiredVig, equityToLockIn}
    } else if (league === "ATP") {
      const seedAmount = 100;
      const desiredVig = .04;
      const equityToLockIn = .01;
      return {seedAmount, desiredVig, equityToLockIn}
    } else if (league === "WTA") {
      const seedAmount = 100;
      const desiredVig = .04;
      const equityToLockIn = .01;
      return {seedAmount, desiredVig, equityToLockIn}
    } else if (league === "NCAAB") {
      const seedAmount = 100;
      const desiredVig = .04;
      const equityToLockIn = .01;
      return {seedAmount, desiredVig, equityToLockIn}
    } else if (league === "NHL") {
      const seedAmount = 100;
      const desiredVig = .04;
      const equityToLockIn = .01;
      return {seedAmount, desiredVig, equityToLockIn}
    } else {
      const seedAmount = 100;
      const desiredVig = 0.04;
      const equityToLockIn = 0.01;
      return {seedAmount, desiredVig, equityToLockIn};
    }
  } else if (timeToStart < 10800 && timeToStart > 1799) {
    if (league === "NCAAF") {
      const seedAmount = 200;
      const desiredVig = 0.02;
      const equityToLockIn = 0.0075;
      return { seedAmount, desiredVig, equityToLockIn };
    } else if (league === "PREMIER-LEAGUE") {
      const seedAmount = 200;
      const desiredVig = 0.025;
      const equityToLockIn = 0.01;
      return { seedAmount, desiredVig, equityToLockIn };
    } else if (league === "NFL") {
      const seedAmount = 500;
      const desiredVig = .015;
      const equityToLockIn = .005;
      return {seedAmount, desiredVig, equityToLockIn}
    } else if (league === "NBA") {
      const seedAmount = 150;
      const desiredVig = .03;
      const equityToLockIn = .0075;
      return {seedAmount, desiredVig, equityToLockIn}
    } else if (league === "FED-EX-500") {
      const seedAmount = 333;
      const desiredVig = .02;
      const equityToLockIn = .0075
      return {seedAmount, desiredVig, equityToLockIn}
    } else if (league === "ATP") {
      const seedAmount = 100;
      const desiredVig = .035;
      const equityToLockIn = .01;
      return {seedAmount, desiredVig, equityToLockIn}
    } else if (league === "WTA") {
      const seedAmount = 100;
      const desiredVig = .04;
      const equityToLockIn = .01;
      return {seedAmount, desiredVig, equityToLockIn}
    } else if (league === "NCAAB") {
      const seedAmount = 100;
      const desiredVig = .04;
      const equityToLockIn = .01;
      return {seedAmount, desiredVig, equityToLockIn}
    } else if (league === "NHL") {
      const seedAmount = 100;
      const desiredVig = .03;
      const equityToLockIn = .01;
      return {seedAmount, desiredVig, equityToLockIn}
    } else {
      const seedAmount = 100;
      const desiredVig = 0.04;
      const equityToLockIn = 0.01;
      return {seedAmount, desiredVig, equityToLockIn};
    }
  } 
  else if (timeToStart < 1800) {
    if (league === "NCAAF") {
      const seedAmount = 200;
      const desiredVig = .02;
      const equityToLockIn = .0075;
      return {seedAmount, desiredVig, equityToLockIn}
    } else if (league === "PREMIER-LEAGUE") {
      const seedAmount = 200;
      const desiredVig = .02;
      const equityToLockIn = .0075;
      return {seedAmount, desiredVig, equityToLockIn}
    } else if (league === "NFL") {
      const seedAmount = 500;
      const desiredVig = .015;
      const equityToLockIn = .005;
      return {seedAmount, desiredVig, equityToLockIn}
    } else if (league === "NBA") {
      const seedAmount = 333;
      const desiredVig = .02;
      const equityToLockIn = .0075;
      return {seedAmount, desiredVig, equityToLockIn}
    } else if (league === "FED-EX-500") {
      const seedAmount = 333;
      const desiredVig = .03;
      const equityToLockIn = .01
      return {seedAmount, desiredVig, equityToLockIn}
    } else if (league === "ATP") {
      const seedAmount = 200;
      const desiredVig = .03;
      const equityToLockIn = .01;
      return {seedAmount, desiredVig, equityToLockIn}
    } else if (league === "WTA") {
      const seedAmount = 155;
      const desiredVig = .04;
      const equityToLockIn = .01;
      return {seedAmount, desiredVig, equityToLockIn}
    } else if (league === "NCAAB") {
      const seedAmount = 250;
      const desiredVig = .04;
      const equityToLockIn = .01
      return {seedAmount, desiredVig, equityToLockIn}
    } else if (league === "NHL") {
      const seedAmount = 200;
      const desiredVig = .03;
      const equityToLockIn = .01;
      return {seedAmount, desiredVig, equityToLockIn}
    } else {
      const seedAmount = 100;
      const desiredVig = .04;
      const equityToLockIn = .01;
      return {seedAmount, desiredVig, equityToLockIn}
    }
  } else {
    if (league === "NCAAF") {
      const seedAmount = 100;
      const desiredVig = 0.04;
      const equityToLockIn = 0.01;
      return { seedAmount, desiredVig, equityToLockIn };
    } else if (league === "PREMIER-LEAGUE") {
      const seedAmount = 100;
      const desiredVig = 0.02;
      const equityToLockIn = 0.0075;
      return { seedAmount, desiredVig, equityToLockIn }
    } else if (league === "NFL") {
      const seedAmount = 250;
      const desiredVig = .02;
      const equityToLockIn = .005;
      return {seedAmount, desiredVig, equityToLockIn}
    } else if (league === "NBA") {
      const seedAmount = 100;
      const desiredVig = .02;
      const equityToLockIn = .0075;
      return {seedAmount, desiredVig, equityToLockIn}
    } else if (league === "FED-EX-500") {
      const seedAmount = 100;
      const desiredVig = .04;
      const equityToLockIn = .01;
      return {seedAmount, desiredVig, equityToLockIn}
    } else {
      const seedAmount = 100;
      const desiredVig = 0.04;
      const equityToLockIn = 0.0075;
      return { seedAmount, desiredVig, equityToLockIn };
    }
  }
}

// equityToLockIn must be lower than desiredVig
function newSeeds(odds, desiredVig, equityToLockIn) {
  const priceMove = desiredVig - equityToLockIn;
  const price = -1 * (odds / 100);
  const percentOfBet = convertToPercent(price);
  const otherSide = percentOfBet + priceMove;
  if (priceMove === 0) {
    throw new Error("Will seed at same price");
  } else {
    const secondSeed = 1 + desiredVig - otherSide;
    const newSeed = convertToDecimal(otherSide);
    const newSeedA = -1 * Math.round(convertDecimalToAmerican(newSeed));
    const secondNew = convertToDecimal(secondSeed);
    const secondNewA = -1 * Math.round(convertDecimalToAmerican(secondNew));
    return { newSeedA, secondNewA };
  }
}

module.exports = {
  convertToDecimal,
  convertToPercent,
  timeToSeed,
  bestBet,
  getInitialSeedAmount,
  getMaxLiability,
  noReseedMLs,
  noReseedSpreads,
  noReseedTotals,
  convertDecimalToAmerican,
  findOtherSide,
  newSeeds,
  vigMap,
  properOrders,
};
