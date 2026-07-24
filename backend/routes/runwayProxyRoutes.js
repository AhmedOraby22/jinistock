const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const runway = require('../services/providers/runwayClient');

const router = express.Router();
router.use(protect);

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir, limits: { fileSize: 200 * 1024 * 1024 } });

function wrapOk(data) {
  return { status: 200, data };
}

router.post('/upload_ephemeral', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ status: 400, error: 'No file' });
    const base = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const uri = `${base.replace(/\/$/, '')}/uploads/${path.basename(req.file.filename)}`;
    // Runway also accepts data URI / public URL; ephemeral upload API varies by account
    return res.json(wrapOk({ uri }));
  } catch (e) {
    return res.status(500).json({ status: 500, error: e.message });
  }
});

router.post('/image_to_video_generate', upload.single('file'), async (req, res) => {
  try {
    let promptImage = req.body.promptImage || req.body.image_url;
    if (req.file) {
      const base = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
      promptImage = `${base.replace(/\/$/, '')}/uploads/${path.basename(req.file.filename)}`;
    }
    if (!promptImage) {
      return res.status(400).json({ status: 400, error: 'file or promptImage required' });
    }
    const data = await runway.postTask('/v1/image_to_video', {
      model: req.body.model || 'gen4_turbo',
      promptImage,
      promptText: req.body.promptText || req.body.prompt || '',
      ratio: req.body.ratio || '1280:720',
      duration: Number(req.body.duration) || 5,
    });
    return res.json(wrapOk(data));
  } catch (e) {
    return res.status(e.response?.status || 500).json({
      status: e.response?.status || 500,
      data: e.response?.data || { error: e.message },
      error: e.message,
    });
  }
});

router.get('/get_task/:id', async (req, res) => {
  try {
    const data = await runway.getTask(req.params.id);
    return res.json(wrapOk(data));
  } catch (e) {
    return res.status(e.response?.status || 500).json({
      status: e.response?.status || 500,
      data: e.response?.data || { error: e.message },
      error: e.message,
    });
  }
});

router.post('/video_to_video', async (req, res) => {
  try {
    const data = await runway.postTask('/v1/video_to_video', {
      model: req.body.model || 'gen4_aleph',
      promptText: req.body.promptText || req.body.prompt,
      ratio: req.body.ratio,
      references: req.body.references,
      videoUri: req.body.videoUri,
      seed: req.body.seed,
    });
    return res.json(wrapOk(data));
  } catch (e) {
    return res.status(e.response?.status || 500).json({
      status: e.response?.status || 500,
      data: e.response?.data,
      error: e.message,
    });
  }
});

router.post('/character_performance', async (req, res) => {
  try {
    const data = await runway.postTask('/v1/character_performance', req.body);
    return res.json(wrapOk(data));
  } catch (e) {
    return res.status(e.response?.status || 500).json({
      status: e.response?.status || 500,
      data: e.response?.data,
      error: e.message,
    });
  }
});

router.post('/video_upscale', async (req, res) => {
  try {
    const data = await runway.postTask('/v1/video_upscale', {
      model: req.body.model || 'upscale_v1',
      videoUri: req.body.videoUri,
    });
    return res.json(wrapOk(data));
  } catch (e) {
    return res.status(e.response?.status || 500).json({
      status: e.response?.status || 500,
      data: e.response?.data,
      error: e.message,
    });
  }
});

module.exports = router;
