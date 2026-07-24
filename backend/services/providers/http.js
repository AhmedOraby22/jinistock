const axios = require('axios');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    const err = new Error(`${name} is not configured on the server`);
    err.statusCode = 503;
    throw err;
  }
  return value;
}

async function requestJson({ method = 'GET', url, headers = {}, data, params, timeout = 120000 }) {
  try {
    const response = await axios({
      method,
      url,
      headers,
      data,
      params,
      timeout,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      validateStatus: () => true,
    });
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      data: response.data,
      headers: response.headers,
    };
  } catch (error) {
    const err = new Error(error.message || 'Upstream request failed');
    err.statusCode = 502;
    err.cause = error;
    throw err;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { requireEnv, requestJson, sleep };
