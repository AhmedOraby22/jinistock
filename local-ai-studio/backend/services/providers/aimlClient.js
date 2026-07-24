const { requireEnv, requestJson } = require('./http');

const AIML_BASE = process.env.AIML_API_BASE || 'https://api.aimlapi.com';

function aimlHeaders() {
  return {
    Authorization: `Bearer ${requireEnv('AIML_API_KEY')}`,
    'Content-Type': 'application/json',
    Accept: '*/*',
  };
}

async function aimlPost(path, body) {
  const url = `${AIML_BASE}/${path.replace(/^\//, '')}`;
  const res = await requestJson({
    method: 'POST',
    url,
    headers: aimlHeaders(),
    data: body,
    timeout: 180000,
  });
  if (!res.ok) {
    const msg =
      res.data?.error ||
      res.data?.message ||
      (typeof res.data === 'string' ? res.data : JSON.stringify(res.data));
    const err = new Error(`AIML error (${res.status}): ${msg}`);
    err.statusCode = res.status;
    err.raw = res.data;
    throw err;
  }
  return res.data;
}

async function aimlGet(path) {
  const url = `${AIML_BASE}/${path.replace(/^\//, '')}`;
  const res = await requestJson({
    method: 'GET',
    url,
    headers: aimlHeaders(),
    timeout: 60000,
  });
  if (!res.ok) {
    const err = new Error(`AIML GET failed (${res.status})`);
    err.statusCode = res.status;
    err.raw = res.data;
    throw err;
  }
  return res.data;
}

module.exports = { aimlPost, aimlGet };
