/**
 * OpenAI proxy routes (Odoo leonardo-form / script.js compatible)
 * POST /openai/proxy — TTS (JSON) or Sora/videos (multipart)
 * GET  /openai/videos/status/:id
 * GET  /openai/proxy/video/:id — download completed video bytes
 */
const express = require('express');
const multer = require('multer');
const { protect } = require('../middleware/auth');
const { getOpenAI } = require('../services/aiProviderService');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.use(protect);

router.post('/proxy', upload.any(), async (req, res) => {
  try {
    const openai = getOpenAI();
    if (!openai) {
      return res.status(503).json({ error: 'OPENAI_API_KEY is not configured' });
    }

    // Multipart = Sora / videos style (Odoo FormData)
    if (req.is('multipart/form-data') || (req.files && req.files.length)) {
      const endpoint = req.body.endpoint || 'videos';
      if (endpoint !== 'videos') {
        return res.status(400).json({ error: `Unsupported multipart endpoint: ${endpoint}` });
      }
      const prompt = req.body.prompt;
      const model = req.body.model || 'sora-2';
      const size = req.body.size || '1280x720';
      const seconds = String(req.body.seconds || req.body.duration || '8');
      const ref = (req.files || []).find((f) => f.fieldname === 'input_reference');

      // Prefer SDK videos API when present; otherwise clear error
      if (typeof openai.videos?.create !== 'function') {
        return res.status(501).json({
          error:
            'Sora / videos API is not available on this OpenAI SDK/account. Use FAL/Runway video models instead.',
        });
      }

      const createParams = {
        model,
        prompt,
        size,
        seconds: Number(seconds) || 8,
      };
      if (ref) {
        // File upload shape depends on SDK; pass buffer when supported
        createParams.input_reference = ref.buffer;
      }
      const created = await openai.videos.create(createParams);
      return res.json(created);
    }

    // JSON body — TTS or generic
    const { endpoint, payload } = req.body || {};
    if (endpoint === 'audio/speech' || endpoint === 'tts') {
      const p = payload || req.body;
      const speech = await openai.audio.speech.create({
        model: p.model || 'tts-1-hd',
        voice: p.voice || 'alloy',
        input: p.input || p.prompt || '',
        response_format: p.response_format || 'mp3',
        speed: typeof p.speed === 'number' ? p.speed : 1,
      });
      const buffer = Buffer.from(await speech.arrayBuffer());
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', 'inline; filename="tts.mp3"');
      return res.send(buffer);
    }

    return res.status(400).json({
      error: 'Use endpoint "audio/speech" (JSON) or multipart endpoint "videos"',
    });
  } catch (err) {
    console.error('openai/proxy:', err.message);
    return res.status(502).json({ error: err.message || 'OpenAI proxy failed' });
  }
});

router.get('/videos/status/:id', async (req, res) => {
  try {
    const openai = getOpenAI();
    if (!openai) return res.status(503).json({ error: 'OPENAI_API_KEY is not configured' });
    if (typeof openai.videos?.retrieve !== 'function') {
      return res.status(501).json({ error: 'Videos API not available on this SDK' });
    }
    const status = await openai.videos.retrieve(req.params.id);
    return res.json(status);
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
});

router.get('/proxy/video/:id', async (req, res) => {
  try {
    const openai = getOpenAI();
    if (!openai) return res.status(503).json({ error: 'OPENAI_API_KEY is not configured' });
    if (typeof openai.videos?.downloadContent !== 'function' && typeof openai.videos?.content !== 'function') {
      return res.status(501).json({ error: 'Video download not available on this SDK' });
    }
    const contentFn = openai.videos.downloadContent || openai.videos.content;
    const file = await contentFn.call(openai.videos, req.params.id);
    const buffer = Buffer.from(await file.arrayBuffer());
    res.setHeader('Content-Type', 'video/mp4');
    return res.send(buffer);
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
});

module.exports = router;
