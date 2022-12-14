require("./loadEnv");
const { Manager } = require("socket.io-client");
const callApi = require("./callApi");

const {
  convertToDecimal,
  convertToPercent,
  convertDecimalToAmerican,
  findOtherSide,
  properOrders,
} = require("./seederUtils");

const url = process.env.FOURCASTER_API_URI;
const wsUrl = process.env.FOURCASTER_WS_API_URI;
const username = process.env.FOURCASTER_USERNAME;
const password = process.env.FOURCASTER_PASSWORD;

callApi({
  url: `${url}/user/login`,
  method: "POST",
  data: {
    username,
    password,
  },
})
  .then((response) => {
    const { user } = response.data;
    const username = user.username;
    const token = user.auth;
    const id = user.id;
    const runningUser = { username, id, token };
    console.log(runningUser);
    const manager = new Manager(wsUrl, {
      reconnectionDelayMax: 1000,
      query: {
        token: token,
      },
    });
    const socket = manager.socket(`/v2/user/${username}`, {
      query: {
        token: token,
      },
    });

    socket.on("connect", () => {
      console.log(`message: ${username} connected to userFeed`);
    });
    socket.on("positionUpdate", async (msg) => {
      const formattedMessage = JSON.parse(msg);
      if (!formattedMessage.unmatched) {
        console.log(
          "user took offer on",
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
        const gameID = formattedMessage.gameID;
        const DesiredVig = 0.04;
        const equityToLockIn = 0.01;
        const priceMove = DesiredVig - equityToLockIn;
        const orderAmount = formattedMessage.unmatched.offered;
        const odds = formattedMessage.unmatched.odds;
        const number = formattedMessage.unmatched.number;
        const type = formattedMessage.unmatched.type;
        const event = formattedMessage.eventName;
        const fillAmount = formattedMessage.unmatched.filled;
        const seedAmount = 100;
        const newSeeds = [];
        if (formattedMessage.unmatched.filled === 0 && orderAmount > 0) {
          console.log(
            "user created offer on ",
            event,
            "on",
            type,
            "for",
            orderAmount,
            "at",
            odds
          );
        } else if (orderAmount === 0) {
          console.log("user canceled offer on", event, "on", type, "at", odds);
        } else {
          console.log(
            "user order on",
            event,
            "matched for",
            fillAmount,
            "on",
            type,
            "at",
            odds
          );
          const price = -1 * (odds / 100);
          const percentOfBet = convertToPercent(price);
          const roundedPercent = Math.round(percentOfBet * 100) / 100;
          const otherSide = roundedPercent + priceMove;
          const side1 = formattedMessage.unmatched.side;
          const secondSeed = 1 + DesiredVig - otherSide;
          const newSeed = convertToDecimal(otherSide);
          const newSeedA = -1 * Math.round(convertDecimalToAmerican(newSeed));
          const secondNew = convertToDecimal(secondSeed);
          const secondNewA =
            -1 * Math.round(convertDecimalToAmerican(secondNew));
          newSeeds.push(newSeedA, secondNewA);
          console.log("New Seed prices", newSeeds);
          await callApi({
            url: `${url}/session/cancelAllOrdersForGame`,
            method: "POST",
            data: {
              gameID,
              type,
            },
            headers: { authorization: token },
          });
          const orderBook = await callApi({
            url: `${url}/exchange/v2/getOrderbook`,
            method: "GET",
            params: {
              gameID,
            },
            headers: { authorization: token },
          });
          const orderParticipants = orderBook.data.games[0].participants;
          console.log(side1);
          const side2 = findOtherSide(orderParticipants, side1, type);
          console.log(side2);
          const orders = properOrders(
            type,
            number,
            gameID,
            side1,
            side2,
            seedAmount,
            newSeedA,
            secondNewA
          );
          await callApi({
            url: `${url}/session/v2/place`,
            method: "POST",
            data: {
              token: token,
              orders,
              gameID,
            },
          });
        }
      }
    });
  })
  .catch(function (error) {
    console.log(error);
  });
