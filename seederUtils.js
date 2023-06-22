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
    console.log(percentOfBet);
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

function subtractAndCheck(newSeedA, x) {
  let result = newSeedA + x;

  if (result > 0 && result < 100) {
    let difference = 100 - result;
    result = (result + difference) * -1;
  }

  return result;
}

function switchSeedNumber(number, odds, type, newSeedA, secondNewA) {
  let switchNumber = false;
  let newNumber = null;
  if (odds > 127) {
    switchNumber = true;
    if (type === "spread") {
      console.log({number})
      if (number) {
        newNumber = number > 0 ? number - 0.25 : number + .25;
        const result = subtractAndCheck(newSeedA, 35);
        console.log({result})
        const newOdds = convertAmericanToPercent(result);
        console.log({newOdds})
        const otherSide = Math.round(applyVig(newOdds));
        console.log({otherSide})
        return { switchNumber, newNumber, result, otherSide };
      }
    }
  } else {
    return { switchNumber, newNumber };
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
  odds,
  sport
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
    const { switchNumber, newNumber, result, otherSide } = switchSeedNumber(
      number,
      odds,
      type,
      newSeedA,
      secondNewA
    );
    console.log({switchNumber})
    if (switchNumber) {
      firstOrder.number = newNumber;
      firstOrder.odds = -1 * result;
      const secondNumber = - newNumber;
      comebackOrders.number = secondNumber;
      comebackOrders.odds = -1 * otherSide;
      console.log({firstOrder, comebackOrders})
    } else {
      firstOrder.number = number;
      const secondNumber = -1 * number;
      comebackOrders.number = secondNumber;
    }
  } else if (type === "total") {
    firstOrder.number = number;
    comebackOrders.number = number;
  }
  return [firstOrder, comebackOrders];
}

function vigMap(league, sport) {
  const seedAmount = 250;
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
