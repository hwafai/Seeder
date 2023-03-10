const callApi = require("../libs/callApi");

async function getPs3838AlternateLines(league, url) {
  return callApi({
    url: `${url}/api/v1/odds/getPs3838AlternateLines`,
    method: "POST",
    data: {
      league,
    },
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

async function editOrder(url, sessionID, volume, token) {
  return callApi({
    url: `${url}/session/editOrder`,
    method: "POST",
    data: {
      sessionID,
      orderVolume: volume,
    },
    headers: {authorization: token},
  });
}

async function cancelAllOrdersForGame(gameID, token, type, url) {
  const data = {
    gameID,
  };

  if (type) {
    data.type = type;
  }

  return callApi({
    url: `${url}/session/cancelAllOrdersForGame`,
    method: "POST",
    data,
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
  getPs3838AlternateLines,
  getSingleOrderbook,
  getOrderbook,
  login,
  editOrder,
  placeOrders,
};
