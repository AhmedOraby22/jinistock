/**
 * Loads backend/data/credit_config_seed.json into PostgreSQL as the active CreditConfig.
 *
 * Usage:  node scripts/seedCreditConfig.js
 *
 * Prefer migrateCreditConfigFromOdoo.js if you restored the Odoo dump into `jini`.
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { prisma, connectDB } = require("../config/db");

(async () => {
  await connectDB();

  const seedPath = path.join(__dirname, "..", "data", "credit_config_seed.json");
  const seed = JSON.parse(fs.readFileSync(seedPath, "utf-8"));

  await prisma.creditDeduction.deleteMany({});
  await prisma.creditConfig.deleteMany({});

  const created = await prisma.creditConfig.create({
    data: {
      name: "Default Credit Configuration (migrated from Odoo)",
      active: true,
      dailyTrialImageCredits: seed.daily_trial_image_credits,
      dailyTrialVideoCredits: seed.daily_trial_video_credits,
      defaultImageDeduction: seed.default_image_deduction,
      defaultVideoDeduction: seed.default_video_deduction,
      deductions: {
        create: (seed.deductions || []).map((d) => ({
          generationType: d.generation_type,
          imageCredits: d.image_credits || 0,
          videoCredits: d.video_credits || 0,
          duration: d.duration ?? null,
          description: d.description || null,
        })),
      },
    },
    include: { deductions: true },
  });

  console.log(`Seeded CreditConfig with ${created.deductions.length} pricing rules.`);
  await prisma.$disconnect();
  process.exit(0);
})().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
