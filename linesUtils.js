const axios = require('axios')
const url = 'https://api.truebookies.com/api/gbs/PlaceBets'
const secret = 'CD9398FE17AEC17BF439D99ED2CCE'
const sha1 = require('sha1')


function returnLinesAgPayload (data) {
    return sha1(secret + JSON.stringify(data)) + JSON.stringify(data)
}

function lineType(type) {
    if (type === 'moneyline') {
        const WagerType = 'M'
        return WagerType
    } else if (type === 'spread') {
        const WagerType = 'S'
        return WagerType
    } else if (type === 'total') {
        const WagerType = 'L'
        return WagerType
    }
}

function teamIDfinder(game, ChosenTeam, side, type) {
    if (type === 'total') {
        if (side === 'over') {
            const ChosenTeamIdx = '2'
            return ChosenTeamIdx
        } else if (side === 'under') {
            const ChosenTeamIdx = '1'
            return ChosenTeamIdx
        }
    } else {
        if (ChosenTeam === game.team1ID) {
            const ChosenTeamIdx = '1'
            return ChosenTeamIdx
        } else if (ChosenTeam === game.team2ID) {
            const ChosenTeamIdx = '2'
            return ChosenTeamIdx
        }
    }
}

function gameFinder(games, event, ChosenTeam, side, type) {
    for (const game of games) {
        if (game.eventName === event) {
            const eventID = game.apiEventID
            const VisitorRotNum = game.awayRotationNumber
            const GameDateTime = game.start
            const SportType = game.sport
            const SportSubType = game.league
            const ChosenTeamIdx = teamIDfinder(game, ChosenTeam, side, type)
            return { eventID, VisitorRotNum, GameDateTime, SportType, SportSubType, ChosenTeamIdx }
        }
    }
}

function teamFinder(teamGames, type, side, event) {
    for (const game of teamGames) {
        if (game.eventName === event) {
            const teams = game.participants
            if (type !== 'total') {
                for (const team of teams) {
                    if (team.id !== side) {
                        const ChosenTeam = team.longName
                        return ChosenTeam
                    }
                }
            } else {
                const ChosenTeam = `${teams[0].longName}/${teams[1].longName}`
                return ChosenTeam
            }
        }
    }
}

function numberFinder(type, number) {
    if (type === 'moneyline') {
        const AdjSpread = 0
        const AdjTotalPoints = 0
        return {AdjSpread, AdjTotalPoints}
    } else if (type === 'spread') {
        const AdjSpread = -1 * number
        const AdjTotalPoints = 0
        return {AdjSpread, AdjTotalPoints}
    } else if (type === 'total') {
        const AdjSpread = 0
        const AdjTotalPoints = number
        return {AdjSpread, AdjTotalPoints}
    }
}

function gameIdSplice(eventID) {
    const Number = eventID.slice(8)
    return Number
}

function OUfinder(ChosenTeamIdx) {
    if (ChosenTeamIdx === '1') {
        const OU = 'O'
        return OU
    } else if (ChosenTeamIdx === '2') {
        const OU = 'U'
        return OU
    }
}

async function linesLOL(AmountWagered, ToWinAmount, FinalMoney, SportType, SportSubType, GameNum, VisitorRotNum, GameDateTime, WagerType, AdjSpread, AdjTotalPoints, ChosenTeam, ChosenTeamIdx, type) {
    const x = {
        TicketNumber: 0,
        CustomerID: '4casters',
        Wagers: [
          {
            WagerNumber: 1,
            AmountWagered: AmountWagered,
            ToWinAmount: ToWinAmount,
            WagerType: WagerType,
            FreePlayFlag: 'N',
            TeaserName: null,
            Items: [
            {
                ItemNumber: 1,
                GameNum: GameNum,
                VisitorRotNum: VisitorRotNum,
                GameDateTime: GameDateTime,
                SportType: SportType,
                SportSubType: SportSubType,
                WagerType: WagerType,
                AdjSpread: AdjSpread,
                AdjTotalPoints: AdjTotalPoints,
                TotalPointsOU:"",
                FinalMoney: FinalMoney,
                ChosenTeam: ChosenTeam,
                ChosenTeamIdx: ChosenTeamIdx,
                TeaserPoints: 0,
                PeriodNumber: 0,
                ListedPitcher1: null,
                ListedPitcher2: null,
                Pitcher1ReqFlag: 'Y',
                Pitcher2ReqFlag: 'Y',
                'OriginatingTicket Number': null
            }]
        }]
    }
    if (type === 'total') {
        const OU = OUfinder(ChosenTeamIdx)
        x.Wagers[0].Items[0].TotalPointsOU = OU
        axios.post(`${url}`, returnLinesAgPayload(x)).then(function (response) {
            console.log(response.data)
        }).catch(e => console.log(e))
    } else {
        axios.post(`${url}`, returnLinesAgPayload(x)).then(function (response) {
            console.log(response.data)
        }).catch(e => console.log(e))
    }
}


module.exports = {
    linesLOL,
    gameFinder,
    teamFinder,
    numberFinder,
    gameIdSplice,
    lineType,
};
