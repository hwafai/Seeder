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
};

const spreadTotalAdjustmentMap = {
  1.5: 58,
  1.75: 50,
  2: 45,
  2.25: 40,
  2.5: 37,
  2.75: 34,
  3: 32,
  3.25: 30,
  3.5: 29,
  3.75: 27,
  4: 26,
  4.25: 25,
  4.5: 24,
};

module.exports = {
  ptAdjustmentMap,
  spreadTotalAdjustmentMap,
  getQuarterGoalValue,
};

function getQuarterGoalValue(total) {
  const value = spreadTotalAdjustmentMap[total];

  console.log("total", total);
  console.log("value", value);

  if (value) {
    return value;
  } else if (
    total >
    Object.keys(spreadTotalAdjustmentMap)[
      Object.keys(spreadTotalAdjustmentMap).length - 1
    ]
  ) {
    return 24;
  } else if (total < Object.keys(spreadTotalAdjustmentMap)[0]) {
    return 58;
  }
}

// console.log(getQuarterGoalValue(2.25))
// console.log(getQuarterGoalValue(5.25))
// console.log(getQuarterGoalValue(1))
