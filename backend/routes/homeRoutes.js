const express = require("express");
const { prisma } = require("../config/db");

const router = express.Router();

// @route GET /api/home/inspire
router.get("/inspire", async (_req, res) => {
  try {
    const images = await prisma.inspireImage.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        url: true,
        title: true,
      },
    });
    res.json({ images });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Could not load inspire gallery" });
  }
});

module.exports = router;
