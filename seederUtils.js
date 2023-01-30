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
  if (timeToStart < 86400) {
    if (league === "NCAAF") {
      const seedAmount = 500;
      const desiredVig = 0.02;
      const equityToLockIn = 0.005;
      return { seedAmount, desiredVig, equityToLockIn };
    } else if (league === "CHAMPIONS-LEAGUE") {
      const seedAmount = 500;
      const desiredVig = 0.02;
      const equityToLockIn = 0.005;
      return { seedAmount, desiredVig, equityToLockIn };
    } else if (league === "PREMIER-LEAGUE") {
      const seedAmount = 100;
      const desiredVig = 0.04;
      const equityToLockIn = 0.005;
      return { seedAmount, desiredVig, equityToLockIn };
    } else if (league === "NFL") {
      const seedAmount = 500;
      const desiredVig = 0.02;
      const equityToLockIn = 0.005;
      return { seedAmount, desiredVig, equityToLockIn };
    } else if (league === "NBA") {
      const seedAmount = 100;
      const desiredVig = 0.04;
      const equityToLockIn = 0.005;
      return { seedAmount, desiredVig, equityToLockIn };
    } else {
      const seedAmount = 100;
      const desiredVig = 0.04;
      const equityToLockIn = 0.005;
      return { seedAmount, desiredVig, equityToLockIn };
    }
  } else {
    if (league === "NCAAF") {
      const seedAmount = 100;
      const desiredVig = 0.04;
      const equityToLockIn = 0.005;
      return { seedAmount, desiredVig, equityToLockIn };
    } else if (league === "CHAMPIONS-LEAGUE") {
      const seedAmount = 100;
      const desiredVig = 0.04;
      const equityToLockIn = 0.005;
      return { seedAmount, desiredVig, equityToLockIn };
    } else if (league === "PREMIER-LEAGUE") {
      const seedAmount = 100;
      const desiredVig = 0.04;
      const equityToLockIn = 0.005;
      return { seedAmount, desiredVig, equityToLockIn };
    } else if (league === "NFL") {
      const seedAmount = 500;
      const desiredVig = 0.02;
      const equityToLockIn = 0.005;
      return { seedAmount, desiredVig, equityToLockIn };
    } else if (league === "NBA") {
      const seedAmount = 100;
      const desiredVig = 0.04;
      const equityToLockIn = 0.005;
      return { seedAmount, desiredVig, equityToLockIn };
    } else {
      const seedAmount = 100;
      const desiredVig = 0.04;
      const equityToLockIn = 0.005;
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
  convertDecimalToAmerican,
  findOtherSide,
  newSeeds,
  vigMap,
  properOrders,
};
