require("./loadEnv");
const { Manager } = require("socket.io-client");
const { login } = require("./apiUtils")

const url = process.env.FOURCASTER_API_URI;
const wsUrl = process.env.FOURCASTER_WS_API_URI;
const bgURL = process.env.BACKGROUND_JOBS_URI;
const linesUsername = process.env.LINES_USERNAME;
const linesPassword = process.env.LINES_PASSWORD;

const { linesLOL, lineType, gameFinder, teamFinder, numberFinder, gameIdSplice} = require("./linesUtils")
const { getTakMaster, getGames } = require("./apiUtils");

login(linesPassword, url, linesUsername)
  .then((response) => {
    const { user } = response.data;
    const username = user.username;
    const token = user.auth;
    const id = user.id;
    const runningUser = {username, id, token};
    console.log(runningUser)
    const manager = new Manager(wsUrl, {
        reconnectionDelayMax: 1000,
        query: { token },
    });
    const socket = manager.socket(`/v2/user/${username}`, {
        query: { token },
    });
    socket.on("connect", () => {
    console.log(`message: ${username} connected to userFeed`);
    });
    socket.on("positionUpdate", async (msg) => {
        const formattedMessage = JSON.parse(msg);
        if (!formattedMessage.unmatched) {
            console.log(
                `${username} took offer on`,
                formattedMessage.eventName,
                "for",
                formattedMessage.matched.risk,
                "on",
                formattedMessage.matched.type,
                formattedMessage.matched.number,
                "at",
                formattedMessage.matched.odds
            );
        } else {
            const eventTitle = formattedMessage.eventName;
            const type = formattedMessage.unmatched.type;
            const odds = formattedMessage.unmatched.odds;
            const number = formattedMessage.unmatched.number;
            const orderAmount = formattedMessage.unmatched.offered;
            const fillAmount = formattedMessage.unmatched.filled;
            if (formattedMessage.unmatched.filled === 0 && orderAmount > 0) {
                console.log(
                  `${username} created offer on `,
                  eventTitle,
                  "on",
                  type,
                  "for",
                  orderAmount,
                  "at",
                  odds
                );
                } else if (orderAmount === 0) {
                console.log(
                  `${username} canceled offer on`,
                  eventTitle,
                  "on",
                  type,
                  "at",
                  odds
                );
                } else {
                console.log(
                  `${username} order on`,
                  eventTitle,
                  "matched for",
                  fillAmount,
                  "on",
                  type,
                  "at",
                  odds
                );
                const side = formattedMessage.matched.side
                const AmountWagered = formattedMessage.matched.win
                const ToWinAmount = formattedMessage.matched.risk
                const FinalMoney = -1 * odds
                const league = formattedMessage.league
                const gameData = await getGames(league, token, url)
                const teamGames = gameData.data.games
                const ChosenTeam = teamFinder(teamGames, type, side, eventTitle)
                const WagerType = lineType(type)
                const { AdjSpread, AdjTotalPoints} = numberFinder(type, number)
                const response = await getTakMaster(bgURL, token, league)
                const games = response.data.games
                const event = eventTitle.replace("'", "")
                const { eventID, VisitorRotNum, GameDateTime, SportType, SportSubType, ChosenTeamIdx } = gameFinder(games, event, ChosenTeam, side, type)
                console.log(ChosenTeam, ChosenTeamIdx)
                const idNumber = gameIdSplice(eventID)
                const GameNum = parseInt(idNumber)

                await linesLOL(AmountWagered, ToWinAmount, FinalMoney, SportType, SportSubType,GameNum, VisitorRotNum, GameDateTime, WagerType, AdjSpread, AdjTotalPoints, ChosenTeam, ChosenTeamIdx, type )
                // axios.post all that good stuff, should be able to take what you need from formattedMessage too fill data for axios.post
            }    
        } 
    });
})
.catch(function (error) {
    console.log(error);
});