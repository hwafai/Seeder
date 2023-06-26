const ptAdjustmentMap = {
    'soccer': {
        "-1.25": {
            adjustment: 0.25,
            difference: 36
        },
        "-1": {
            adjustment: 0.25,
            difference: 42
        },
        "-0.75": {
            adjustment: 0.25,
            difference: 36
        },
        "-0.5": {
            adjustment: 0.25,
            difference: 36
        },
        "-0.25": {
            adjustment: 0.25,
            difference: 45
        },
        "0": {
            adjustment: 0.25,
            difference: 56
        },
        "0.25": {
            adjustment: 0.25,
            difference: 45
        },
        "0.5": {
            adjustment: 0.25,
            difference: 36
        },
        "0.75": {
            adjustment: 0.25,
            difference: 36
        },
        "1": {
            adjustment: 0.25,
            difference: 42
        },
        "1.25": {
            adjustment: 0.25,
            difference: 36
        },
    },
    "golf": {
        adjustment: 0.5,
        difference: 35
    },
    "basketball": {
        adjustment: 0.5,
        difference: 9
    }
}

const sport = "soccer"
const number = -0.75

const {adjustment, difference} = ptAdjustmentMap[sport][number]
console.log(ptAdjustmentMap[sport])
console.log({adjustment, difference})

module.exports = {
    ptAdjustmentMap,
}