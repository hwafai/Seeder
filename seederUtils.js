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
function newSeeds(odds){
  const desiredVig = 0.015;
  const equityToLockIn = 0.015;
  const priceMove = desiredVig - equityToLockIn;
  const price = -1 * (odds / 100);
  const percentOfBet = convertToPercent(price);
  const roundedPercent = Math.round(percentOfBet * 100) / 100;
  const otherSide = roundedPercent + priceMove;
  const secondSeed = 1 + desiredVig - otherSide;
  const newSeed = convertToDecimal(otherSide);
  const newSeedA = -1 * Math.round(convertDecimalToAmerican(newSeed));
  const secondNew = convertToDecimal(secondSeed);
  const secondNewA = -1 * Math.round(convertDecimalToAmerican(secondNew));
  return {newSeedA, secondNewA}
}

module.exports = {
  convertToDecimal,
  convertToPercent,
  convertDecimalToAmerican,
  findOtherSide,
  newSeeds,
  properOrders,
};
