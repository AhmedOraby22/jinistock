/**
 * Suno proxy stubs (Odoo script.js paths). Wire SUNO_API_KEY when ready.
 */
const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.post('/generate', async (_req, res) => {
  if (!process.env.SUNO_API_KEY) {
    return res.status(503).json({
      code: 503,
      msg: 'SUNO_API_KEY is not configured. Music generation is not wired yet.',
      error: 'Suno not configured',
    });
  }
  return res.status(501).json({
    code: 501,
    msg: 'Suno generate proxy is not fully wired. Use a dedicated music provider integration.',
    error: 'Not implemented',
  });
});

router.get('/get_task/:id', async (_req, res) => {
  return res.status(501).json({ code: 501, msg: 'Suno task poll not implemented', data: null });
});

router.get('/download', async (_req, res) => {
  return res.status(501).json({ error: 'Suno download not implemented' });
});

router.post('/callback', async (_req, res) => {
  return res.json({ ok: true });
});

module.exports = router;
