const { requireEnv, requestJson, sleep } = require('./http');

function falAuthHeader() {
  const key = requireEnv('FAL_KEY');
  return { Authorization: `Key ${key}` };
}

function queueBase(modelPath) {
  return `https://queue.fal.run/${modelPath.replace(/^\//, '')}`;
}

async function falRun(modelPath, input) {
  const { data, status } = await requestJson({
    method: 'POST',
    url: `https://fal.run/${modelPath.replace(/^\//, '')}`,
    headers: {
      ...falAuthHeader(),
      'Content-Type': 'application/json',
    },
    data: input,
    timeout: 300000,
  });
  if (status >= 400) {
    const err = new Error(data?.detail || data?.error || `FAL error ${status}`);
    err.response = { status, data };
    throw err;
  }
  return data;
}

async function falQueueSubmit(modelPath, input) {
  const { data, status } = await requestJson({
    method: 'POST',
    url: queueBase(modelPath),
    headers: {
      ...falAuthHeader(),
      'Content-Type': 'application/json',
    },
    data: input,
    timeout: 120000,
  });
  if (status >= 400) {
    const err = new Error(data?.detail || data?.error || `FAL queue submit error ${status}`);
    err.response = { status, data };
    throw err;
  }
  return data;
}

async function falQueueStatus(statusUrl) {
  const { data, status } = await requestJson({
    method: 'GET',
    url: statusUrl,
    headers: falAuthHeader(),
  });
  if (status >= 400) {
    const err = new Error(data?.detail || `FAL status error ${status}`);
    err.response = { status, data };
    throw err;
  }
  return data;
}

async function falQueueResult(responseUrl) {
  const { data, status } = await requestJson({
    method: 'GET',
    url: responseUrl,
    headers: falAuthHeader(),
    timeout: 120000,
  });
  if (status === 202 || status === 409) {
    const err = new Error('not ready');
    err.response = { status, data };
    throw err;
  }
  if (status >= 400) {
    const err = new Error(data?.detail || `FAL result error ${status}`);
    err.response = { status, data };
    throw err;
  }
  return data;
}

/** Resolve status/result URLs from submit payload or request_id + modelPath */
function resolveQueueUrls(modelPath, requestId, hint = {}) {
  const base = queueBase(modelPath);
  const statusUrl =
    hint.status_url ||
    hint.statusUrl ||
    (requestId ? `${base}/requests/${requestId}/status` : null);
  const responseUrl =
    hint.response_url ||
    hint.responseUrl ||
    (requestId ? `${base}/requests/${requestId}` : null);
  return { statusUrl, responseUrl };
}

async function falStatusByRequestId(modelPath, requestId, hint = {}) {
  const { statusUrl } = resolveQueueUrls(modelPath, requestId, hint);
  if (!statusUrl) throw new Error('status_url or request_id required');
  return falQueueStatus(statusUrl);
}

async function falResultByRequestId(modelPath, requestId, hint = {}) {
  const { responseUrl } = resolveQueueUrls(modelPath, requestId, hint);
  if (!responseUrl) throw new Error('response_url or request_id required');
  return falQueueResult(responseUrl);
}

async function falGenerate(modelPath, input, { mode = 'sync', maxPolls = 120, intervalMs = 5000 } = {}) {
  if (mode === 'sync') {
    return falRun(modelPath, input);
  }
  const submitted = await falQueueSubmit(modelPath, input);
  const requestId = submitted.request_id || submitted.requestId;
  const statusUrl = submitted.status_url || submitted.statusUrl;
  const responseUrl = submitted.response_url || submitted.responseUrl;

  if (!requestId && !statusUrl) {
    // Some fal.run endpoints return result immediately even when queued path used
    if (submitted.images || submitted.video || submitted.audio) return submitted;
    throw new Error('FAL queue submit did not return request_id');
  }

  for (let i = 0; i < maxPolls; i++) {
    const st = statusUrl
      ? await falQueueStatus(statusUrl)
      : await falStatusByRequestId(modelPath, requestId);
    const status = String(st.status || '').toUpperCase();
    if (status === 'COMPLETED' || status === 'OK') {
      if (responseUrl) return falQueueResult(responseUrl);
      return falResultByRequestId(modelPath, requestId);
    }
    if (status === 'FAILED' || status === 'ERROR') {
      throw new Error(st.error || st.detail || 'FAL generation failed');
    }
    await sleep(intervalMs);
  }
  throw new Error('FAL generation timed out');
}

// Aliases matching Odoo-style / proxy route expectations
const falSubmit = falQueueSubmit;
const falStatus = falStatusByRequestId;
const falResult = falResultByRequestId;
const runSync = falRun;
const submit = falQueueSubmit;

module.exports = {
  falRun,
  falQueueSubmit,
  falQueueStatus,
  falQueueResult,
  falGenerate,
  falStatusByRequestId,
  falResultByRequestId,
  resolveQueueUrls,
  falSubmit,
  falStatus,
  falResult,
  runSync,
  submit,
};
