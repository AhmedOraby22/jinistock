const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const fal = require('../services/providers/falClient');
const wavespeed = require('../services/providers/wavespeedClient');
const { getModelDef, resolveModelId } = require('../services/modelRegistry');

const router = express.Router();
router.use(protect);

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir, limits: { fileSize: 80 * 1024 * 1024 } });

function publicUrl(req, filename) {
  const base = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
  return `${base.replace(/\/$/, '')}/uploads/${path.basename(filename)}`;
}

/** GET FAL key for client-side fal.run (legacy Odoo pattern) — prefer server proxy instead */
router.get('/client-key', (req, res) => {
  const key = process.env.FAL_KEY || process.env.FAL_API_KEY;
  if (!key) {
    return res.status(503).json({ success: false, error: 'FAL_KEY not configured on server' });
  }
  return res.json({ success: true, key });
});

router.post('/storage/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file' });
    const url = publicUrl(req, req.file.filename);
    // Prefer local HTTPS URL; optionally push to FAL storage later
    return res.json({ success: true, url });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/wavespeed/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file' });
    return res.json({ success: true, url: publicUrl(req, req.file.filename) });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * Generic async pipeline: /fal/:modelSlug/start|status|result
 * modelSlug examples: hailuo-23-i2v, veo31-fast-i2v, nano-banana-pro
 */
/** Odoo / frontend slug → canonical modelRegistry id */
const FAL_SLUG_TO_MODEL = {
  'hailuo-23-i2v': 'hailuo_23',
  'hailuo-2.3': 'hailuo_23',
  'hailuo-02-i2v': 'hailuo02',
  'hailuo-02': 'hailuo02',
  'fal-minimax-hailuo-02': 'hailuo02',
  'veo31-fast': 'veo31_fast_i2v',
  'veo31-fast-i2v': 'veo31_fast_i2v',
  'veo31-fast-t2v': 'veo31_fast_t2v',
  'veo31-lite-start-end': 'veo31_lite_start_end',
  'google-veo31-fast-text-to-video': 'veo31_fast_t2v',
  'kling-v26-pro-i2v': 'kling_v26_pro',
  'kling-v26-pro': 'kling_v26_pro',
  'kling-v30-std': 'kling_v30_std_i2v',
  'kling-v30-std-i2v': 'kling_v30_std_i2v',
  'kling-o3-4k-reference-to-video': 'kling_o3_4k_reference_to_video',
  'kling-v3-turbo-std-t2v': 'kling_v3_turbo_std_t2v',
  'kling-elements-create': 'kling_elements',
  'kling-elements': 'kling_elements',
  'fal-seeddance': 'seedance',
  'seedance-2-fast-i2v': 'seedance_2_fast_i2v',
  'seedance-2-mini-i2v-turbo': 'seedance_2_mini_i2v_turbo',
  'seedance-2-fast-reference-to-video': 'seedance_2_fast_reference_to_video',
  'seedance-2-fast-t2v': 'seedance_2_fast_t2v',
  'vidu-q2-pro-fast': 'vidu_q2_pro_fast',
  'vidu-q2-turbo': 'vidu_q2_pro_fast',
  'nano-banana-pro': 'nano_banana_pro',
  'nano-banana-pro-edit-multi': 'nano_banana_pro',
  'google-nano-banana-pro-edit': 'nano_banana_pro',
  'google-nano-banana-pro-t2i': 'google_nano_banana_pro_t2i',
  'google-nano-banana-2-t2i': 'google_nano_banana_2_t2i',
  'google-nano-banana-2-i2i': 'google_nano_banana_2_i2i',
  'google-nano-banana-2-edit': 'nano_banana_2_edit',
  'fal-kontext': 'kontext_pro',
  'fal-kontext-max-multi': 'kontext_max',
  'kling-video-edit': 'kling_video_edit_fast',
  'kling-video-edit-fast': 'kling_video_edit_fast',
  'kling-v26-motion-control': 'kling_v26_motion_control',
  'hunyuan-avatar': 'hunyuan_avatar',
  'mmaudio-v2': 'mmaudio_v2',
  gemini_edit: 'nano_banana',
  'gemini-25-flash-image': 'nano_banana',
  'prompt-enhancer': 'prompt_optimizer',
  'imagen4-preview-ultra': 'imagen4_ultra',
  'imagen-3.0-generate-002': 'imagen3',
  seedream: 'seedream_image',
  'heygen-v3-lipsync-precision': 'heygen_v3_lipsync_precision',
  'sync-lipsync': 'sync_lipsync',
};

async function handleStart(req, res, modelId) {
  try {
    const def = getModelDef(modelId);
    if (!def) return res.status(400).json({ error: `Unknown model: ${modelId}` });

    const input = def.buildInput
      ? def.buildInput({
          prompt: req.body.prompt,
          ratio: req.body.aspect_ratio || req.body.ratio,
          duration: req.body.duration,
          resolution: req.body.resolution,
          imageUrl: req.body.image_url || req.body.image || req.body.start_image_url,
          videoUrl: req.body.video_url || req.body.video,
          audioUrl: req.body.audio_url || req.body.audio,
          ...req.body,
        })
      : req.body;

    if (def.provider === 'wavespeed') {
      const data = await wavespeed.postModel(def.falPath || def.wavespeedPath, input);
      const requestId = wavespeed.extractRequestId(data);
      const url = wavespeed.extractOutputUrl(data);
      return res.status(requestId ? 202 : 200).json({
        data: {
          request_id: requestId,
          id: requestId,
          video: url ? { url } : undefined,
          images: url && !url.includes('.mp4') ? [{ url }] : undefined,
          status: url ? 'COMPLETED' : 'IN_QUEUE',
        },
      });
    }

    if (def.async === false || def.provider === 'fal') {
      if (def.async === false) {
        const data = await fal.runSync(def.falPath, input);
        const url = def.extractOutput ? def.extractOutput(data) : null;
        return res.status(200).json({
          data: {
            ...data,
            video: url && String(url).includes('.mp') ? { url } : data.video,
            images: data.images || (url ? [{ url }] : undefined),
            synchronous: true,
          },
        });
      }
      const submitted = await fal.submit(def.falPath, input);
      const requestId = submitted.request_id || submitted.requestId;
      return res.status(202).json({
        data: { request_id: requestId, id: requestId, status: 'IN_QUEUE' },
      });
    }

    return res.status(400).json({ error: `Unsupported provider for ${modelId}` });
  } catch (e) {
    const status = e.response?.status || 500;
    return res.status(status).json({
      error: e.message,
      raw_response: typeof e.response?.data === 'string'
        ? e.response.data.slice(0, 500)
        : JSON.stringify(e.response?.data || {}).slice(0, 500),
    });
  }
}

async function handleStatus(req, res, modelId) {
  try {
    const requestId = req.body.request_id || req.body.id || req.params.requestId;
    if (!requestId) return res.status(400).json({ error: 'request_id required' });
    const def = getModelDef(modelId);

    if (def?.provider === 'wavespeed') {
      const data = await wavespeed.getPrediction(requestId);
      const url = wavespeed.extractOutputUrl(data);
      const st = String(data?.data?.status || data?.status || 'IN_QUEUE').toUpperCase();
      return res.json({
        data: {
          status: st === 'COMPLETED' || st === 'SUCCESS' ? 'COMPLETED' : st,
          request_id: requestId,
          video: url ? { url } : undefined,
          outputs: url ? [url] : data?.data?.outputs || data?.outputs,
          error: data?.data?.error || data?.error,
        },
      });
    }

    const falPath = def?.falPath;
    if (!falPath) {
      return res.status(400).json({ error: `No FAL path for model: ${modelId}` });
    }
    const data = await fal.status(falPath, requestId);
    const st = String(data.status || 'IN_QUEUE').toUpperCase();
    let resultPayload = data;
    if (st === 'COMPLETED' || st === 'OK') {
      try {
        resultPayload = await fal.result(falPath, requestId);
      } catch (_) {
        /* status may already include output */
      }
    }
    const url = def?.extractOutput ? def.extractOutput(resultPayload) : null;
    return res.json({
      data: {
        status: st === 'OK' ? 'COMPLETED' : st,
        request_id: requestId,
        video: url && String(url).match(/\.(mp4|webm|mov)/i) ? { url } : resultPayload.video,
        images: resultPayload.images,
        outputs: url ? [url] : undefined,
        error: data.error || resultPayload.error,
      },
    });
  } catch (e) {
    return res.status(e.response?.status || 500).json({ error: e.message });
  }
}

async function handleResult(req, res, modelId) {
  try {
    const requestId =
      req.body.request_id || req.body.id || req.params.requestId || req.params.id;
    if (!requestId) return res.status(400).json({ error: 'request_id required' });
    const def = getModelDef(modelId);

    if (def?.provider === 'wavespeed') {
      const data = await wavespeed.getPrediction(requestId);
      const url = wavespeed.extractOutputUrl(data);
      return res.json({
        data: {
          video: url ? { url } : undefined,
          images: url && !String(url).includes('.mp4') ? [{ url }] : undefined,
          outputs: url ? [url] : data?.data?.outputs || [],
          status: 'COMPLETED',
        },
      });
    }

    const falPath = def?.falPath;
    if (!falPath) {
      return res.status(400).json({ error: `No FAL path for model: ${modelId}` });
    }
    const data = await fal.result(falPath, requestId);
    const url = def?.extractOutput ? def.extractOutput(data) : null;
    return res.json({
      data: {
        ...data,
        video: data.video || (url && String(url).match(/mp4|webm/i) ? { url } : undefined),
        images: data.images || (url ? [{ url }] : undefined),
        outputs: url ? [url] : undefined,
      },
    });
  } catch (e) {
    const status = e.response?.status || 500;
    if (status === 202 || status === 409) {
      return res.status(202).json({ error: 'not ready', status: 202 });
    }
    return res.status(status).json({ error: e.message });
  }
}

router.post('/:slug/start', (req, res) => {
  const modelId = FAL_SLUG_TO_MODEL[req.params.slug] || resolveModelId(req.params.slug);
  return handleStart(req, res, modelId);
});

router.post('/:slug/status', (req, res) => {
  const modelId = FAL_SLUG_TO_MODEL[req.params.slug] || resolveModelId(req.params.slug);
  return handleStatus(req, res, modelId);
});

router.post('/:slug/result', (req, res) => {
  const modelId = FAL_SLUG_TO_MODEL[req.params.slug] || resolveModelId(req.params.slug);
  return handleResult(req, res, modelId);
});

router.get('/:slug/result/:requestId', (req, res) => {
  const modelId = FAL_SLUG_TO_MODEL[req.params.slug] || resolveModelId(req.params.slug);
  req.body = { request_id: req.params.requestId };
  return handleResult(req, res, modelId);
});

/** Sync helpers used by Odoo script */
router.post('/gemini_edit', async (req, res) => {
  try {
    const data = await fal.runSync('fal-ai/gemini-25-flash-image/edit', {
      prompt: req.body.prompt,
      image_urls: req.body.image_urls,
      aspect_ratio: req.body.aspect_ratio,
    });
    return res.json({ data, credits_deducted: 0 });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

router.post('/prompt-enhancer', async (req, res) => {
  try {
    // Lightweight enhance via OpenAI if available; else echo
    const OpenAI = require('openai');
    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json({
        status: 200,
        enhanced_prompt: `${req.body.prompt || ''}, highly detailed, professional quality`,
      });
    }
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You enhance image/video generation prompts. Return only the improved prompt text.',
        },
        { role: 'user', content: req.body.prompt || '' },
      ],
      max_tokens: 400,
    });
    return res.json({
      status: 200,
      enhanced_prompt: completion.choices[0]?.message?.content?.trim() || req.body.prompt,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

router.post('/lipsync', async (req, res) => {
  try {
    const data = await fal.runSync('fal-ai/kling-video/lipsync/audio-to-video', {
      video_url: req.body.video_url,
      text: req.body.text,
      voice_id: req.body.voice_id,
      voice_speed: req.body.voice_speed,
    });
    return res.json({ data });
  } catch (e) {
    return res.status(e.response?.status || 500).json({ error: e.message });
  }
});

module.exports = router;
