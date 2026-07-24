const { requireEnv, requestJson, sleep } = require('./http');

const WAVESPEED_BASE = 'https://api.wavespeed.ai/api/v3';

function wavespeedHeaders() {
  return {
    Authorization: `Bearer ${requireEnv('WAVESPEED_API_KEY')}`,
    'Content-Type': 'application/json',
  };
}

async function wavespeedPost(path, body) {
  const clean = String(path || '').replace(/^\//, '');
  const { data, status } = await requestJson({
    method: 'POST',
    url: `${WAVESPEED_BASE}/${clean}`,
    headers: wavespeedHeaders(),
    data: body,
    timeout: 120000,
  });
  if (status >= 400) {
    const err = new Error(data?.message || data?.error || `WaveSpeed error ${status}`);
    err.response = { status, data };
    throw err;
  }
  return data;
}

async function wavespeedGet(path) {
  const clean = String(path || '').replace(/^\//, '');
  const { data, status } = await requestJson({
    method: 'GET',
    url: `${WAVESPEED_BASE}/${clean}`,
    headers: wavespeedHeaders(),
  });
  if (status >= 400) {
    const err = new Error(data?.message || data?.error || `WaveSpeed GET error ${status}`);
    err.response = { status, data };
    throw err;
  }
  return data;
}

function extractWavespeedJobId(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const idKeys = ['request_id', 'id', 'task_id', 'prediction_id', 'job_id', 'uuid'];
  const tryDict = (d) => {
    if (!d || typeof d !== 'object') return null;
    for (const k of idKeys) {
      const v = d[k];
      if (typeof v === 'string' && v.trim() && !v.startsWith('http')) return v.trim();
    }
    return null;
  };
  return tryDict(payload.data) || tryDict(payload) || tryDict(payload.data?.data);
}

function extractWavespeedOutputUrl(payload) {
  if (!payload) return null;
  const inner = payload.data?.data || payload.data || payload;
  if (inner?.video?.url) return inner.video.url;
  if (typeof inner?.video === 'string' && inner.video.startsWith('http')) return inner.video;
  const outputs = inner?.outputs || payload.outputs;
  if (Array.isArray(outputs) && outputs.length) {
    const first = outputs[0];
    if (typeof first === 'string') return first;
    return first?.url || first?.video_url || first?.output_url || null;
  }
  if (inner?.images?.[0]?.url) return inner.images[0].url;
  if (typeof inner?.images?.[0] === 'string') return inner.images[0];
  return null;
}

function isComplete(status) {
  const s = String(status || '').toUpperCase();
  return ['COMPLETED', 'SUCCESS', 'SUCCEEDED', 'DONE', 'FINISHED', 'COMPLETE'].includes(s);
}

function isFailed(status) {
  const s = String(status || '').toUpperCase();
  return ['FAILED', 'ERROR', 'FAILURE', 'CANCELLED', 'TIMEOUT'].includes(s);
}

async function wavespeedGetPrediction(jobId) {
  return wavespeedGet(`predictions/${jobId}/result`);
}

async function wavespeedPoll(jobId, { maxPolls = 180, intervalMs = 5000 } = {}) {
  for (let i = 0; i < maxPolls; i++) {
    const data = await wavespeedGetPrediction(jobId);
    const status = data?.data?.status || data?.status || data?.data?.data?.status;
    if (isComplete(status)) {
      const url = extractWavespeedOutputUrl(data);
      if (!url) throw new Error('WaveSpeed completed but no output URL');
      return { ...data, outputUrl: url };
    }
    if (isFailed(status)) {
      throw new Error(data?.data?.error || data?.error || 'WaveSpeed generation failed');
    }
    const early = extractWavespeedOutputUrl(data);
    if (early) return { ...data, outputUrl: early };
    await sleep(intervalMs);
  }
  throw new Error('WaveSpeed generation timed out');
}

async function wavespeedGenerate(modelPath, input, options = {}) {
  const data = await wavespeedPost(modelPath, input);
  const url = extractWavespeedOutputUrl(data);
  if (url) return { ...data, outputUrl: url };
  const jobId = extractWavespeedJobId(data);
  if (!jobId) {
    throw new Error('WaveSpeed did not return a job id or output URL');
  }
  return wavespeedPoll(jobId, options);
}

// Aliases for proxy routes
const postModel = wavespeedPost;
const getPrediction = wavespeedGetPrediction;
const extractRequestId = extractWavespeedJobId;
const extractOutputUrl = extractWavespeedOutputUrl;

module.exports = {
  wavespeedPost,
  wavespeedGet,
  wavespeedGetPrediction,
  wavespeedPoll,
  wavespeedGenerate,
  extractWavespeedJobId,
  extractWavespeedOutputUrl,
  postModel,
  getPrediction,
  extractRequestId,
  extractOutputUrl,
};
