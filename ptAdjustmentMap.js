const ptAdjustmentMap = {
  soccer: {
    "-2": {
      adjustment: 0.25,
      difference: 29,
    },
    "-1.75": {
      adjustment: 0.25,
      difference: 29,
    },
    "-1.5": {
      adjustment: 0.25,
      difference: 29,
    },
    "-1.25": {
      adjustment: 0.25,
      difference: 29,
    },
    "-1": {
      adjustment: 0.25,
      difference: 38,
    },
    "-0.75": {
      adjustment: 0.25,
      difference: 36,
    },
    "-0.5": {
      adjustment: 0.25,
      difference: 38,
    },
    "-0.25": {
      adjustment: 0.25,
      difference: 38,
    },
    0: {
      adjustment: 0.25,
      difference: 44,
    },
    0.25: {
      adjustment: 0.25,
      difference: 38,
    },
    0.5: {
      adjustment: 0.25,
      difference: 38,
    },
    0.75: {
      adjustment: 0.25,
      difference: 36,
    },
    1: {
      adjustment: 0.25,
      difference: 38,
    },
    1.25: {
      adjustment: 0.25,
      difference: 29,
    },
    1.5: {
      adjustment: 0.25,
      difference: 29,
    },
    1.75: {
      adjustment: 0.25,
      difference: 29,
    },
    2: {
      adjustment: 0.25,
      difference: 29,
    },
  },
  golf: {
    adjustment: 0.5,
    difference: 35,
  },
  basketball: {
    adjustment: 0.5,
    difference: 9,
  },
};

const sport = "soccer";
const number = 1.75;
const adjustedNumber = number - 2;

const { adjustment, difference } = ptAdjustmentMap[sport][adjustedNumber];
console.log(ptAdjustmentMap[sport]);
console.log({ adjustment, difference });

module.exports = {
  ptAdjustmentMap,
};
