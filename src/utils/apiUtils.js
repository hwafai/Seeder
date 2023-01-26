const callApi = require("../libs/callApi");

async function getOrderbook(gameID, url, token) {
  return callApi({
    url: `${url}/exchange/v2/getOrderbook`,
    method: "GET",
    params: {
      gameID,
    },
    headers: { authorization: token },
  });
}

async function getSingleOrderbook(gameID, url, token) {
  return callApi({
    url: `${url}/exchange/getSingleOrderbook`,
    method: "POST",
    data: {
      gameID: gameID,
    },
    headers: { authorization: token },
  });
}

async function getGameLiability(url, token, gameID) {
  return callApi({
    url: `${url}/user/getGameLiability`,
    method: "GET",
    params: {
      gameID,
    },
    headers: { authorization: token },
  });
}

async function getGames(league, token, url) {
  return callApi({
    url: `${url}/exchange/v2/getGames`,
    method: "GET",
    params: {
      league,
    },
    headers: { authorization: token },
  });
}

async function login(password, url, username) {
  return callApi({
    url: `${url}/user/login`,
    method: "POST",
    data: {
      username,
      password,
    },
  });
}

async function cancelAllOrdersForGame(gameID, token, type, url) {
  return callApi({
    url: `${url}/session/cancelAllOrdersForGame`,
    method: "POST",
    data: {
      gameID,
      type,
    },
    headers: { authorization: token },
  });
}

async function placeOrders(gameID, orders, token, url) {
  return callApi({
    url: `${url}/session/v2/place`,
    method: "POST",
    data: {
      token: token,
      orders,
      gameID,
    },
  });
}

module.exports = {
  cancelAllOrdersForGame,
  getGameLiability,
  getGames,
  getOrderbook,
  getSingleOrderbook,
  login,
  placeOrders,
};
