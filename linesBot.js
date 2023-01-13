require("./loadEnv");
const { Manager } = require("socket.io-client");
const { login } = require("./apiUtils")

const url = process.env.FOURCASTER_API_URI;
const wsUrl = process.env.FOURCASTER_WS_API_URI;
const linesUsername = process.env.LINES_USERNAME;
const linesPassword = process.env.LINES_PASSWORD;

login(linesPassword, url, linesUsername)
  .then((response) => {
    console.log(response)
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
            const event = formattedMessage.eventName;
            const type = formattedMessage.unmatched.type;
            const odds = formattedMessage.unmatched.odds;
            const number = formattedMessage.unmatched.number;
            const orderAmount = formattedMessage.unmatched.offered;
            const fillAmount = formattedMessage.unmatched.filled;
            if (formattedMessage.unmatched.filled === 0 && orderAmount > 0) {
                console.log(
                  `${username} created offer on `,
                  event,
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
                  event,
                  "on",
                  type,
                  "at",
                  odds
                );
                } else {
                console.log(
                  `${username} order on`,
                  event,
                  "matched for",
                  fillAmount,
                  "on",
                  type,
                  "at",
                  odds
                );
                // axios.post all that good stuff, should be able to take what you need from formattedMessage too fill data for axios.post
            }    
        } 
    });
})
.catch(function (error) {
    console.log(error);
});