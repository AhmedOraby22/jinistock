const express = require("express");
const { protect } = require("../middleware/auth");

const router = express.Router();

// @route GET /api/credits
router.get("/", protect, async (req, res) => {
  res.json({
    imageCredits: req.user.imageCredits,
    videoCredits: req.user.videoCredits,
    maxImageCredits: req.user.maxImageCredits,
    maxVideoCredits: req.user.maxVideoCredits,
  });
});

module.exports = router;
