const express = require("express");
const { protect } = require("../middleware/auth");
const { createPayment, verifyHmac } = require("../services/paymobService");
const { prisma } = require("../config/db");

const router = express.Router();

async function findActivePackage(packageId) {
  return prisma.creditPackage.findFirst({
    where: {
      active: true,
      OR: [{ id: packageId }, { slug: packageId }],
    },
  });
}

// @route GET /api/payment/packages
router.get("/packages", async (_req, res) => {
  try {
    const packages = await prisma.creditPackage.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        priceCents: true,
        imageCredits: true,
        videoCredits: true,
        highlight: true,
      },
    });
    res.json({ packages });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Could not load packages" });
  }
});

// @route POST /api/payment/checkout
router.post("/checkout", protect, async (req, res) => {
  try {
    const { packageId, method, phoneNumber } = req.body;
    const pkg = await findActivePackage(packageId);
    if (!pkg) return res.status(400).json({ message: "Invalid package" });

    const tx = await prisma.transaction.create({
      data: {
        userId: req.user.id,
        amountCents: pkg.priceCents,
        creditsPackage: {
          slug: pkg.slug,
          name: pkg.name,
          imageCredits: pkg.imageCredits,
          videoCredits: pkg.videoCredits,
        },
        paymentMethod: method === "wallet" ? "wallet" : "card",
        status: "pending",
      },
    });

    const { orderId, redirectUrl } = await createPayment({
      amountCents: pkg.priceCents,
      merchantOrderId: tx.id,
      method,
      billingData: {
        apartment: "NA",
        email: req.user.email,
        floor: "NA",
        first_name: req.user.name.split(" ")[0] || req.user.name,
        last_name: req.user.name.split(" ")[1] || req.user.name,
        street: "NA",
        building: "NA",
        phone_number: phoneNumber || "01000000000",
        shipping_method: "NA",
        postal_code: "NA",
        city: "Cairo",
        country: "EG",
        state: "NA",
      },
    });

    await prisma.transaction.update({
      where: { id: tx.id },
      data: { paymobOrderId: String(orderId) },
    });

    res.json({ redirectUrl, transactionId: tx.id });
  } catch (err) {
    console.error(err?.response?.data || err.message);
    res.status(500).json({ message: "Could not start payment", error: err.message });
  }
});

// @route POST /api/payment/callback
router.post("/callback", express.json(), async (req, res) => {
  const obj = req.body.obj || req.body;

  const validHmac = req.query.hmac ? verifyHmac(req.query) : true;
  if (!validHmac) return res.status(401).send("Invalid HMAC");

  const merchantOrderId = obj?.order?.merchant_order_id;
  const success = obj?.success;

  if (merchantOrderId) {
    const tx = await prisma.transaction.findUnique({ where: { id: merchantOrderId } });
    if (tx && tx.status === "pending") {
      await prisma.transaction.update({
        where: { id: tx.id },
        data: {
          status: success ? "paid" : "failed",
          rawCallback: obj,
        },
      });

      if (success) {
        const pkg = tx.creditsPackage || {};
        await prisma.user.update({
          where: { id: tx.userId },
          data: {
            imageCredits: { increment: pkg.imageCredits || 0 },
            videoCredits: { increment: pkg.videoCredits || 0 },
          },
        });
      }
    }
  }

  res.sendStatus(200);
});

module.exports = router;
