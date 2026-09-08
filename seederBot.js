require("./loadEnv");
const { Manager } = require("socket.io-client");

// import off the board listener
// const OffTheBoardListener = require("./src/libs/OffTheBoardListener");
// const offTheBoardListener = new OffTheBoardListener();

const {
  newSeeds,
  findOtherSide,
  properOrders,
  vigMap,
} = require("./seederUtils");

const {
  cancelAllOrdersForGame,
  getOrderbook,
  login,
  placeOrders,
} = require("./apiUtils");

const url = process.env.FOURCASTER_API_URI;
const wsUrl = process.env.FOURCASTER_WS_API_URI;
const username = process.env.FOURCASTER_USERNAME;
const password = process.env.FOURCASTER_PASSWORD;

// The API rotates any login token older than 30 days and hands the replacement
// back in an X-Auth-Token header we never read, so a long-lived process ends up
// authenticating with a token that no longer exists. Re-login well inside that
// window and keep the fresh token. Login is additive (each one mints a new
// token without deleting the old), so this does not disturb the live socket.
const TOKEN_REFRESH_MS = 10 * 24 * 60 * 60 * 1000;

// Held in an object so the socket handlers below read the current token on each
// call rather than closing over the value that was current at startup.
const auth = { token: null };

function scheduleTokenRefresh() {
  const timer = setTimeout(async () => {
    try {
      const response = await login(password, url, username);
      const refreshed = response.data.user.auth;
      if (refreshed) {
        auth.token = refreshed;
        console.log(`${username} refreshed auth token`);
      } else {
        console.log(`${username} token refresh returned no token, keeping old`);
      }
    } catch (e) {
      // Keep the existing token and try again on the next tick; it stays valid
      // until it hits 30 days, so a transient login failure is not fatal.
      console.log(
        `${username} token refresh failed:`,
        (e.response && e.response.data) || e.message,
      );
    }
    scheduleTokenRefresh();
  }, TOKEN_REFRESH_MS);
  // Do not hold the event loop open for the timer alone.
  if (timer.unref) timer.unref();
}

login(password, url, username)
  .then((response) => {
    const { user } = response.data;
    const username = user.username;
    const token = user.auth;
    const id = user.id;
    auth.token = token;
    const runningUser = { username, id, token };
    console.log(runningUser);
    scheduleTokenRefresh();
    const manager = new Manager(wsUrl, {
      reconnectionDelayMax: 1000,
      query: { token },
      transports: ["websocket"],
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
          formattedMessage.matched.odds,
        );
        const gameID = formattedMessage.gameID;
        const odds = formattedMessage.matched.odds;
        const number = formattedMessage.matched.number;
        const type = formattedMessage.matched.type;
        const fillThreshold = 0.333;
        const orderBook = await getOrderbook(gameID, url, auth.token);
        const { sport } = formattedMessage;
        const { seedAmount, desiredVig, equityToLockIn } = await vigMap();
        if (!(formattedMessage.matched.risk / 100 < fillThreshold)) {
          try {
            await cancelAllOrdersForGame(gameID, auth.token, type, url);
          } catch (e) {
            if (e.response && e.response.data) {
              console.log(e.response.data);
            }
          }
          const side1 = formattedMessage.matched.side;
          const { newSeedA, secondNewA } = newSeeds(
            odds,
            desiredVig,
            equityToLockIn,
          );
          const orderParticipants = orderBook.data.game.participants;
          const side2 = findOtherSide(orderParticipants, side1, type);
          const orders = properOrders(
            type,
            number,
            gameID,
            side1,
            side2,
            seedAmount,
            newSeedA,
            secondNewA,
            odds,
            sport,
            "take",
            orderBook.data.game.mainTotal,
          );
          await placeOrders(gameID, orders, auth.token, url);
        }
      } else {
        const gameID = formattedMessage.gameID;
        const orderAmount = formattedMessage.unmatched.offered;
        const odds = formattedMessage.unmatched.odds;
        const number = formattedMessage.unmatched.number;
        const type = formattedMessage.unmatched.type;
        const event = formattedMessage.eventName;
        const fillAmount = formattedMessage.unmatched.filled;
        const fillThreshold = 0.333;
        if (formattedMessage.unmatched.filled === 0 && orderAmount > 0) {
          console.log(
            `${username} created offer on `,
            event,
            "on",
            type,
            "for",
            orderAmount,
            "at",
            odds,
          );
        } else if (orderAmount === 0) {
          console.log(
            `${username} canceled offer on`,
            event,
            "on",
            type,
            "at",
            odds,
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
            odds,
          );
          const orderBook = await getOrderbook(gameID, url, auth.token);
          const { sport } = formattedMessage;
          const { seedAmount, desiredVig, equityToLockIn } = await vigMap();
          if (
            !(
              (formattedMessage.unmatched.offered -
                formattedMessage.unmatched.remaining) /
                formattedMessage.unmatched.offered <
              fillThreshold
            )
          ) {
            try {
              await cancelAllOrdersForGame(gameID, auth.token, type, url);
            } catch (e) {
              if (e.response && e.response.data) {
                console.log(e.response.data);
              }
            }
            const side1 = formattedMessage.unmatched.side;
            const { newSeedA, secondNewA } = newSeeds(
              odds,
              desiredVig,
              equityToLockIn,
            );
            const orderParticipants = orderBook.data.game.participants;
            const side2 = findOtherSide(orderParticipants, side1, type);
            const orders = properOrders(
              type,
              number,
              gameID,
              side1,
              side2,
              seedAmount,
              newSeedA,
              secondNewA,
              odds,
              sport,
              "make",
              orderBook.data.game.mainTotal,
            );
            await placeOrders(gameID, orders, auth.token, url);
          }
        }
      }
    });
  })
  .catch(function (error) {
    console.log(error);
  });

process.on("unhandledRejection", (reason, p) => {
  console.log("Unhandled Rejection at:", p, "reason:", reason);
  // application specific logging, throwing an error, or other logic here
});
