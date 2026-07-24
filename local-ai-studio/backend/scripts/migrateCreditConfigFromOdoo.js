/**
 * Copies flux_ai_credit_config + flux_ai_credit_deduction from the restored
 * Odoo DB (ODOO_DATABASE_URL) into the new ai_studio CreditConfig tables.
 *
 * Usage: node scripts/migrateCreditConfigFromOdoo.js
 *
 * Falls back to seedCreditConfig.js (JSON) if Odoo DB is unavailable.
 */
require("dotenv").config();
const { Client } = require("pg");
const { prisma, connectDB } = require("../config/db");

async function run() {
  const url = process.env.ODOO_DATABASE_URL;
  if (!url) {
    throw new Error("ODOO_DATABASE_URL is not set");
  }

  const odoo = new Client({ connectionString: url });
  await odoo.connect();

  const { rows: configs } = await odoo.query(`
    SELECT *
    FROM flux_ai_credit_config
    WHERE COALESCE(active, true) = true
    ORDER BY COALESCE(sequence, id) ASC
    LIMIT 1
  `);

  if (!configs.length) {
    await odoo.end();
    throw new Error("No active flux_ai_credit_config row found in Odoo DB");
  }

  const cfg = configs[0];
  const { rows: deductions } = await odoo.query(
    `
    SELECT generation_type, image_credits, video_credits, duration, description
    FROM flux_ai_credit_deduction
    WHERE config_id = $1
    ORDER BY id ASC
  `,
    [cfg.id]
  );
  await odoo.end();

  await connectDB();

  await prisma.creditDeduction.deleteMany({});
  await prisma.creditConfig.deleteMany({});

  const created = await prisma.creditConfig.create({
    data: {
      name: cfg.name || "Default Credit Configuration (from Odoo)",
      active: true,
      dailyTrialImageCredits: cfg.daily_trial_image_credits ?? 9,
      dailyTrialVideoCredits: cfg.daily_trial_video_credits ?? 42,
      defaultImageDeduction: cfg.default_image_deduction ?? 1,
      defaultVideoDeduction: cfg.default_video_deduction ?? 1,
      deductions: {
        create: deductions.map((d) => ({
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

  console.log(
    `Migrated CreditConfig "${created.name}" with ${created.deductions.length} pricing rules from Odoo.`
  );
  await prisma.$disconnect();
  process.exit(0);
}

run().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
