const express = require("express");
const { protect } = require("../middleware/auth");
const { prisma } = require("../config/db");
const { resolveCost } = require("../utils/creditConfig");
const { runGeneration } = require("../services/aiProviderService");

const router = express.Router();

const IMAGE_TYPES = new Set([
  "text_to_image",
  "image_to_image",
  "flux_pro",
  "flux_realism",
  "nano_banana",
  "nano_banana_pro",
  "nano_banana_2_edit",
  "google_nano_banana_pro_t2i",
  "google_nano_banana_2_t2i",
  "google_nano_banana_2_i2i",
  "kontext_pro",
  "kontext_max",
  "upscale",
  "ideogram_reframe",
  "seedream_image",
  "qwen_multi_angles",
  "imagen4_ultra",
  "imagen3"
]);

function inferMediaType(generationType, model, url) {
  const key = String(generationType || model || "").toLowerCase();
  if (IMAGE_TYPES.has(key) || key.includes("image") || key.includes("nano_banana") || key.includes("flux")) {
    return "image";
  }
  if (typeof url === "string") {
    const path = url.split("?")[0].toLowerCase();
    if (/\.(png|jpe?g|webp|gif)$/.test(path)) return "image";
    if (/\.(mp3|wav|ogg|m4a)$/.test(path)) return "audio";
    if (/\.(glb|gltf)$/.test(path)) return "model";
  }
  return "video";
}

router.post("/", protect, async (req, res) => {
  try {
    const {
      generationType,
      model,
      prompt,
      inputFileUrl,
      duration,
      resolution,
      aspectRatio,
      ratio,
      imageUrl,
      videoUrl,
      audioUrl,
      lastImageUrl,
      endImageUrl,
      startImageUrl
    } = req.body || {};

    const typeKey = generationType || model;
    if (!typeKey) {
      return res.status(400).json({ message: "generationType or model is required" });
    }
    const promptText = prompt != null ? String(prompt).trim() : "";
    const hasMedia =
      !!(inputFileUrl || imageUrl || videoUrl || audioUrl || lastImageUrl || endImageUrl || startImageUrl);
    if (!promptText && !hasMedia) {
      return res.status(400).json({
        message: "prompt or an input media URL/file is required"
      });
    }

    const cost = await resolveCost(typeKey, duration ?? null);
    const imageCost = Number(cost.image_credits || 0);
    const videoCost = Number(cost.video_credits || 0);

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: "User not found" });

    if ((user.imageCredits || 0) < imageCost || (user.videoCredits || 0) < videoCost) {
      return res.status(402).json({
        message: "Insufficient credits",
        required: { image: imageCost, video: videoCost },
        available: { image: user.imageCredits, video: user.videoCredits }
      });
    }

    const generation = await prisma.generation.create({
      data: {
        userId: user.id,
        generationType: typeKey,
        model: model || typeKey,
        prompt: promptText || "(media-only)",
        inputFileUrl: inputFileUrl || imageUrl || videoUrl || null,
        creditsSpent: imageCost + videoCost,
        status: "processing"
      }
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        imageCredits: { decrement: imageCost },
        videoCredits: { decrement: videoCost }
      }
    });

    try {
      const result = await runGeneration({
        generationType: typeKey,
        model: model || typeKey,
        prompt: promptText,
        inputFileUrl: inputFileUrl || imageUrl || videoUrl || null,
        duration,
        resolution,
        aspectRatio: aspectRatio || ratio,
        ratio: ratio || aspectRatio,
        imageUrl: imageUrl || startImageUrl || inputFileUrl,
        videoUrl,
        audioUrl,
        lastImageUrl: lastImageUrl || endImageUrl,
        endImageUrl: endImageUrl || lastImageUrl,
        startImageUrl: startImageUrl || imageUrl
      });

      const outputUrl = result.outputUrl || result.url || null;
      if (!result.success || !outputUrl) {
        throw new Error(result.error || "Generation failed — no output URL");
      }

      const mediaType = result.mediaType || inferMediaType(typeKey, model, outputUrl);

      const completed = await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: "completed",
          outputUrl
        }
      });

      const remaining = await prisma.user.findUnique({
        where: { id: user.id },
        select: { imageCredits: true, videoCredits: true }
      });

      return res.json({
        success: true,
        url: outputUrl,
        mediaType,
        provider: result.provider || null,
        credits: {
          image: remaining.imageCredits,
          video: remaining.videoCredits
        },
        remainingCredits: {
          imageCredits: remaining.imageCredits,
          videoCredits: remaining.videoCredits
        },
        generation: completed
      });
    } catch (providerError) {
      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: "failed",
          errorMessage: providerError.message || "Generation failed"
        }
      });

      await prisma.user.update({
        where: { id: user.id },
        data: {
          imageCredits: { increment: imageCost },
          videoCredits: { increment: videoCost }
        }
      });

      return res.status(502).json({
        message: providerError.message || "AI provider failed",
        refunded: true
      });
    }
  } catch (error) {
    console.error("Generate error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/history", protect, async (req, res) => {
  try {
    const history = await prisma.generation.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 50
    });
    return res.json({ history });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
