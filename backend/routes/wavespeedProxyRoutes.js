const express = require('express');
const { protect } = require('../middleware/auth');
const wavespeed = require('../services/providers/wavespeedClient');

const router = express.Router();
router.use(protect);

const MODEL_PATHS = {
  'prompt-optimizer': 'wavespeed-ai/prompt-optimizer',
  'eleven-v3': 'elevenlabs/eleven-v3',
  'gpt-image-2-edit': 'openai/gpt-image-2/edit',
  'gpt-image-2-t2i': 'openai/gpt-image-2/text-to-image',
  'grok-reference-to-video': 'xai/grok-imagine-video/reference-to-video',
  'grok-video-extend': 'xai/grok-imagine-video/extend',
  'gemini-omni-flash-video-edit': 'google/gemini-omni-flash/video-edit',
  'nano-banana-2-edit': 'google/nano-banana-2/edit',
};

router.post('/prompt-optimizer', async (req, res) => {
  try {
    const data = await wavespeed.postModel(MODEL_PATHS['prompt-optimizer'], req.body);
    return res.json(data);
  } catch (e) {
    return res.status(e.response?.status || 500).json({ error: e.message });
  }
});

router.get('/prompt-optimizer/:id', async (req, res) => {
  try {
    const data = await wavespeed.getPrediction(req.params.id);
    return res.json(data);
  } catch (e) {
    return res.status(e.response?.status || 500).json({ error: e.message });
  }
});

router.post('/:slug/start', async (req, res) => {
  try {
    const pathKey = MODEL_PATHS[req.params.slug] || req.params.slug;
    const data = await wavespeed.postModel(pathKey, req.body);
    const requestId = wavespeed.extractRequestId(data);
    const url = wavespeed.extractOutputUrl(data);
    return res.status(requestId && !url ? 202 : 200).json({
      data: {
        request_id: requestId,
        id: requestId,
        outputs: url ? [url] : data?.data?.outputs || data?.outputs,
        video: url && String(url).includes('mp4') ? { url } : undefined,
        status: url ? 'completed' : 'pending',
      },
      id: requestId,
      credits_deducted: 0,
    });
  } catch (e) {
    return res.status(e.response?.status || 500).json({ error: e.message });
  }
});

router.post('/:slug/status', async (req, res) => {
  try {
    const id = req.body.request_id || req.body.prediction_id || req.body.id;
    if (!id) return res.status(400).json({ error: 'request_id required' });
    const data = await wavespeed.getPrediction(id);
    return res.json(data);
  } catch (e) {
    return res.status(e.response?.status || 500).json({ error: e.message });
  }
});

router.post('/:slug/result', async (req, res) => {
  try {
    const id = req.body.request_id || req.body.prediction_id || req.body.id;
    if (!id) return res.status(400).json({ error: 'request_id required' });
    const data = await wavespeed.getPrediction(id);
    return res.json(data);
  } catch (e) {
    return res.status(e.response?.status || 500).json({ error: e.message });
  }
});

router.get('/:slug/:id', async (req, res) => {
  try {
    const data = await wavespeed.getPrediction(req.params.id);
    return res.json(data);
  } catch (e) {
    return res.status(e.response?.status || 500).json({ error: e.message });
  }
});

/** Legacy Odoo: POST body starts job; POST /status polls */
router.post('/grok-reference-to-video', async (req, res) => {
  try {
    const data = await wavespeed.postModel(MODEL_PATHS['grok-reference-to-video'], {
      images: req.body.images,
      prompt: req.body.prompt,
      duration: req.body.duration,
      resolution: req.body.resolution,
    });
    const predictionId = wavespeed.extractRequestId(data);
    const videoUrl = wavespeed.extractOutputUrl(data);
    return res.json({
      prediction_id: predictionId,
      result_url: null,
      status_text: videoUrl ? 'completed' : 'processing',
      video_url: videoUrl,
      credits_deducted: 0,
      data,
    });
  } catch (e) {
    return res.status(e.response?.status || 500).json({ error: e.message });
  }
});

router.post('/grok-reference-to-video/status', async (req, res) => {
  try {
    const data = await wavespeed.getPrediction(req.body.prediction_id);
    return res.json({ data });
  } catch (e) {
    return res.status(e.response?.status || 500).json({ error: e.message });
  }
});

router.post('/grok-video-extend', async (req, res) => {
  try {
    const data = await wavespeed.postModel(MODEL_PATHS['grok-video-extend'], {
      video: req.body.video,
      prompt: req.body.prompt,
      duration: req.body.duration,
    });
    return res.json({
      prediction_id: wavespeed.extractRequestId(data),
      status_text: 'processing',
      video_url: wavespeed.extractOutputUrl(data),
      credits_deducted: 0,
      data,
    });
  } catch (e) {
    return res.status(e.response?.status || 500).json({ error: e.message });
  }
});

router.post('/grok-video-extend/status', async (req, res) => {
  try {
    const data = await wavespeed.getPrediction(req.body.prediction_id);
    return res.json({ data });
  } catch (e) {
    return res.status(e.response?.status || 500).json({ error: e.message });
  }
});

router.post('/gemini-omni-flash-video-edit', async (req, res) => {
  try {
    const data = await wavespeed.postModel(MODEL_PATHS['gemini-omni-flash-video-edit'], {
      video: req.body.video,
      prompt: req.body.prompt,
    });
    return res.json({
      prediction_id: wavespeed.extractRequestId(data),
      status_text: 'processing',
      video_url: wavespeed.extractOutputUrl(data),
      credits_deducted: 0,
      data,
    });
  } catch (e) {
    return res.status(e.response?.status || 500).json({ error: e.message });
  }
});

router.post('/gemini-omni-flash-video-edit/status', async (req, res) => {
  try {
    const data = await wavespeed.getPrediction(req.body.prediction_id);
    return res.json({ data });
  } catch (e) {
    return res.status(e.response?.status || 500).json({ error: e.message });
  }
});

module.exports = router;
