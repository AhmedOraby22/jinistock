const { requireEnv, requestJson, sleep } = require('./http');

const RUNWAY_BASE = 'https://api.dev.runwayml.com';

function runwayHeaders() {
  return {
    Authorization: `Bearer ${requireEnv('RUNWAY_API_KEY')}`,
    'Content-Type': 'application/json',
    'X-Runway-Version': '2024-11-06',
  };
}

async function runwayPost(path, body) {
  const url = path.startsWith('http') ? path : `${RUNWAY_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const { data, status } = await requestJson({
    method: 'POST',
    url,
    headers: runwayHeaders(),
    data: body,
    timeout: 120000,
  });
  if (status >= 400) {
    const err = new Error(
      (typeof data === 'object' && (data.error || data.message)) || `Runway error ${status}`
    );
    err.response = { status, data };
    throw err;
  }
  return data;
}

async function runwayGetTask(taskId) {
  const { data, status } = await requestJson({
    method: 'GET',
    url: `${RUNWAY_BASE}/v1/tasks/${taskId}`,
    headers: runwayHeaders(),
  });
  if (status >= 400) {
    const err = new Error(data?.error || `Runway task error ${status}`);
    err.response = { status, data };
    throw err;
  }
  return data;
}

function extractRunwayVideoUrl(task) {
  const output = task?.output?.[0] ?? task?.task?.output?.[0];
  if (!output) return null;
  if (typeof output === 'string') return output;
  return output.uri || output.url || null;
}

async function pollRunwayTask(taskId, { maxPolls = 200, intervalMs = 3000 } = {}) {
  for (let i = 0; i < maxPolls; i++) {
    const task = await runwayGetTask(taskId);
    const status = String(task.status || '').toUpperCase();
    if (status === 'SUCCEEDED') {
      const url = extractRunwayVideoUrl(task);
      if (!url) throw new Error('Runway succeeded but no video URL');
      return { ...task, videoUrl: url };
    }
    if (status === 'FAILED') {
      const msg = task.failure?.message || task.failure || 'Runway generation failed';
      throw new Error(typeof msg === 'string' ? msg : 'Runway generation failed');
    }
    await sleep(intervalMs);
  }
  throw new Error('Runway generation timed out');
}

async function runwayImageToVideo(payload) {
  const created = await runwayPost('/v1/image_to_video', payload);
  const taskId = created?.id || created?.task_id || created?.task?.id;
  if (!taskId) {
    // Some responses may already include output
    const immediate = extractRunwayVideoUrl(created);
    if (immediate) return immediate;
    throw new Error('Runway did not return a task id for image_to_video');
  }
  const done = await pollRunwayTask(taskId);
  return done.videoUrl || extractRunwayVideoUrl(done);
}

// Aliases for proxy routes
const postTask = runwayPost;
const getTask = runwayGetTask;

module.exports = {
  runwayPost,
  runwayGetTask,
  pollRunwayTask,
  runwayImageToVideo,
  extractRunwayVideoUrl,
  postTask,
  getTask,
};
