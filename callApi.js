const axios = require("axios");

const callApi = async ({ url, method = "GET", data, headers, params }) => {
  const response = await axios({ url, method, data, headers, params });
  return response.data;
};

module.exports = callApi;
