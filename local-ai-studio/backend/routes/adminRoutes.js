const express = require("express");
const crypto = require("crypto");
const { prisma } = require("../config/db");
const { protect, adminOnly } = require("../middleware/auth");
const { hashPassword } = require("../utils/password");

const router = express.Router();

router.use(protect, adminOnly);

function parseCredits(value, field) {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
  return n;
}

function parsePositiveInt(value, field) {
  const n = parseCredits(value, field);
  if (n === undefined || n <= 0) {
    throw new Error(`${field} must be a positive integer`);
  }
  return n;
}

function parseSlug(value) {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  if (!slug) throw new Error("slug is required");
  return slug;
}

// @route GET /api/admin/stats
router.get("/stats", async (_req, res) => {
  const [users, creditAgg, admins] = await Promise.all([
    prisma.user.count(),
    prisma.user.aggregate({
      _sum: { imageCredits: true, videoCredits: true, creditsUsed: true },
    }),
    prisma.user.count({ where: { role: "admin" } }),
  ]);

  res.json({
    users,
    admins,
    totalImageCredits: creditAgg._sum.imageCredits || 0,
    totalVideoCredits: creditAgg._sum.videoCredits || 0,
    totalCreditsUsed: creditAgg._sum.creditsUsed || 0,
  });
});

// @route GET /api/admin/users
router.get("/users", async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
  const q = (req.query.q || "").trim();
  const skip = (page - 1) * limit;

  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        imageCredits: true,
        videoCredits: true,
        maxImageCredits: true,
        maxVideoCredits: true,
        creditsUsed: true,
        needsPasswordReset: true,
        legacyOdooUserId: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  res.json({
    users,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
});

// @route GET /api/admin/users/:id
router.get("/users/:id", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      imageCredits: true,
      videoCredits: true,
      maxImageCredits: true,
      maxVideoCredits: true,
      creditsUsed: true,
      needsPasswordReset: true,
      legacyOdooUserId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user });
});

// @route PATCH /api/admin/users/:id/credits
// Body: { imageCredits?, videoCredits?, maxImageCredits?, maxVideoCredits?, mode?: "set"|"add" }
router.patch("/users/:id/credits", async (req, res) => {
  try {
    const mode = req.body.mode === "add" ? "add" : "set";
    const imageCredits = parseCredits(req.body.imageCredits, "imageCredits");
    const videoCredits = parseCredits(req.body.videoCredits, "videoCredits");
    const maxImageCredits = parseCredits(req.body.maxImageCredits, "maxImageCredits");
    const maxVideoCredits = parseCredits(req.body.maxVideoCredits, "maxVideoCredits");

    if (
      imageCredits === undefined &&
      videoCredits === undefined &&
      maxImageCredits === undefined &&
      maxVideoCredits === undefined
    ) {
      return res.status(400).json({ message: "Provide at least one credit field to update" });
    }

    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "User not found" });

    const data = {};
    if (imageCredits !== undefined) {
      data.imageCredits = mode === "add" ? existing.imageCredits + imageCredits : imageCredits;
    }
    if (videoCredits !== undefined) {
      data.videoCredits = mode === "add" ? existing.videoCredits + videoCredits : videoCredits;
    }
    if (maxImageCredits !== undefined) data.maxImageCredits = maxImageCredits;
    if (maxVideoCredits !== undefined) data.maxVideoCredits = maxVideoCredits;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        imageCredits: true,
        videoCredits: true,
        maxImageCredits: true,
        maxVideoCredits: true,
        creditsUsed: true,
        updatedAt: true,
      },
    });

    res.json({ user, message: "Credits updated" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @route PATCH /api/admin/users/:id/role
router.patch("/users/:id/role", async (req, res) => {
  const role = req.body.role;
  if (role !== "user" && role !== "admin") {
    return res.status(400).json({ message: "role must be user or admin" });
  }

  if (req.params.id === req.user.id && role !== "admin") {
    return res.status(400).json({ message: "You cannot remove your own admin role" });
  }

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      imageCredits: true,
      videoCredits: true,
    },
  });

  res.json({ user, message: `Role set to ${role}` });
});

// @route PATCH /api/admin/users/:id/password
router.patch("/users/:id/password", async (req, res) => {
  try {
    const newPassword = String(req.body.newPassword || "").trim();
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "User not found" });

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        password: await hashPassword(newPassword),
        needsPasswordReset: false,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    res.json({ user, message: "Password updated" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @route POST /api/admin/users/:id/reset-link
router.post("/users/:id/reset-link", async (req, res) => {
  try {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "User not found" });

    const token = crypto.randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { id: req.params.id },
      data: {
        passwordResetToken: crypto.createHash("sha256").update(token).digest("hex"),
        passwordResetExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        needsPasswordReset: true,
      },
    });

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${clientUrl}/reset-password?token=${token}&email=${encodeURIComponent(existing.email)}`;

    res.json({
      email: existing.email,
      resetUrl,
      expiresInHours: 24,
      message: "Reset link generated",
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @route GET /api/admin/packages
router.get("/packages", async (_req, res) => {
  const packages = await prisma.creditPackage.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  res.json({ packages });
});

// @route POST /api/admin/packages
router.post("/packages", async (req, res) => {
  try {
    const slug = parseSlug(req.body.slug || req.body.name);
    const name = String(req.body.name || slug).trim();
    const priceCents = parsePositiveInt(req.body.priceCents ?? req.body.priceEgp * 100, "price");
    const imageCredits = parsePositiveInt(req.body.imageCredits, "imageCredits");
    const videoCredits = parsePositiveInt(req.body.videoCredits, "videoCredits");
    const sortOrder = parseCredits(req.body.sortOrder, "sortOrder") ?? 0;
    const highlight = Boolean(req.body.highlight);
    const active = req.body.active !== false;
    const description = req.body.description ? String(req.body.description).trim() : null;

    const pkg = await prisma.creditPackage.create({
      data: {
        slug,
        name,
        description,
        priceCents,
        imageCredits,
        videoCredits,
        sortOrder,
        highlight,
        active,
      },
    });

    res.status(201).json({ package: pkg, message: "Product created" });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({ message: "A product with this slug already exists" });
    }
    res.status(400).json({ message: err.message });
  }
});

// @route PATCH /api/admin/packages/:id
router.patch("/packages/:id", async (req, res) => {
  try {
    const existing = await prisma.creditPackage.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Product not found" });

    const data = {};
    if (req.body.slug !== undefined) data.slug = parseSlug(req.body.slug);
    if (req.body.name !== undefined) data.name = String(req.body.name).trim();
    if (req.body.description !== undefined) {
      data.description = req.body.description ? String(req.body.description).trim() : null;
    }
    if (req.body.priceCents !== undefined || req.body.priceEgp !== undefined) {
      data.priceCents = parsePositiveInt(
        req.body.priceCents ?? req.body.priceEgp * 100,
        "price"
      );
    }
    if (req.body.imageCredits !== undefined) {
      data.imageCredits = parsePositiveInt(req.body.imageCredits, "imageCredits");
    }
    if (req.body.videoCredits !== undefined) {
      data.videoCredits = parsePositiveInt(req.body.videoCredits, "videoCredits");
    }
    if (req.body.sortOrder !== undefined) {
      data.sortOrder = parseCredits(req.body.sortOrder, "sortOrder") ?? 0;
    }
    if (req.body.highlight !== undefined) data.highlight = Boolean(req.body.highlight);
    if (req.body.active !== undefined) data.active = Boolean(req.body.active);

    const pkg = await prisma.creditPackage.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ package: pkg, message: "Product updated" });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({ message: "A product with this slug already exists" });
    }
    res.status(400).json({ message: err.message });
  }
});

// @route DELETE /api/admin/packages/:id
router.delete("/packages/:id", async (req, res) => {
  const existing = await prisma.creditPackage.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: "Product not found" });

  await prisma.creditPackage.update({
    where: { id: req.params.id },
    data: { active: false },
  });

  res.json({ message: "Product deactivated" });
});

module.exports = router;
