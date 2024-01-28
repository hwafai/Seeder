require("./loadEnv");

const { ptAdjustmentMap } = require("./ptAdjustmentMap");
const oddsThreshold = Number(process.env.ODDS_THRESHOLD);

function getPtValue(sport, pt) {
  if (ptAdjustmentMap[sport] && ptAdjustmentMap[sport][pt]) {
    return ptAdjustmentMap[sport][pt];
  } else {
    return {
      adjustment: 0.25,
      difference: 27,
    };
  }
}

function convertToDecimal(otherSide) {
  const newBase = otherSide / (1 - otherSide) + 1;
  return newBase;
}

function convertPercentToAmerican(x) {
  if (x > 0.5) {
    const y = 1 - x;
    const z = -1 * (x / y) * 100;
    return z;
  }
  if (x < 0.5) {
    const y = 1 - x;
    const z = (y / x) * 100;
    return z;
  }
  const z = 100;
  return z;
}

function applyVig(newOdds) {
  const pie = 1 + 0.04;
  const otherSidePercent = pie - newOdds;
  const otherSide = convertPercentToAmerican(otherSidePercent);
  return otherSide;
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

function convertAmericanToPercent(x) {
  const z = Number(x);
  if (z > 0) {
    const y = 100 / (z + 100);
    return y;
  }
  if (z < 0) {
    const y = z / (z - 100);
    return y;
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

function subtractAndCheck(americanOdds, lean) {
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

// function typeBasedAdjustment(adjustment, betType) {
//   if (betType === "make") {
//     return adjustment
//   } else if (betType === "take") {
//     return -adjustment
//   }
// }

function switchSeedNumber(sport, number, odds, type, newSeedA, side1, betType) {
  let switchNumber = false;
  let newNumber = null;
  if (odds > oddsThreshold) {
    switchNumber = true;
    if (type === "spread") {
      const { adjustment, difference } = getPtValue(sport, number);
      newNumber =
        betType === "make" ? number - adjustment : number + adjustment;
      const result = subtractAndCheck(newSeedA, difference);
      const newOdds = convertAmericanToPercent(result);
      const otherSide = Math.round(applyVig(newOdds));
      return { switchNumber, newNumber, result, otherSide };
    } else if (type === "total") {
      const adjustedNumber = number - 2;
      const { adjustment, difference } = getPtValue(sport, adjustedNumber);
      newNumber = side1 === "over" ? number - adjustment : number + adjustment;
      const result = subtractAndCheck(newSeedA, difference);
      const newOdds = convertAmericanToPercent(result);
      const otherSide = Math.round(applyVig(newOdds));
      return { switchNumber, newNumber, result, otherSide };
    }
  } else {
    return { switchNumber, newNumber };
  }
}

function returnBaseAmount(bet, odds) {
  if (odds > 0) {
    return bet
  }
  return bet * (Math.abs(odds) / 100)
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
) {
  const firstOrderOdds = -1 * newSeedA;
  const firstOrder = {
    gameID,
    type,
    side: side1,
    bet: returnBaseAmount(seedAmount, firstOrderOdds),
    odds: firstOrderOdds,
    expirationMinutes: 0,
  };
  const secondOrderOdds = -1 * secondNewA;
  const comebackOrders = {
    gameID,
    type,
    side: side2,
    bet: returnBaseAmount(seedAmount, secondOrderOdds),
    odds: secondOrderOdds,
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

function vigMap(league, sport) {
  const seedAmount = 100;
  const desiredVig = 0.04;
  const equityToLockIn = 0.01;
  return { seedAmount, desiredVig, equityToLockIn };
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
