const { prisma } = require("../config/db");

/**
 * Prefer an exact (generation_type + duration) match, fall back to the
 * flat (generation_type, no duration) rule, then to the global default.
 * Mirrors the old Odoo CreditController.deduct_credits / Mongoose resolveCost.
 */
function resolveCostFromConfig(config, generationType, duration = null) {
  if (!config) return { imageCredits: 1, videoCredits: 0 };

  const deductions = config.deductions || [];
  let rule = null;

  if (duration != null) {
    rule = deductions.find(
      (d) => d.generationType === generationType && d.duration === duration
    );
  }
  if (!rule) {
    rule = deductions.find(
      (d) =>
        d.generationType === generationType &&
        (d.duration === null || d.duration === undefined)
    );
  }
  if (rule) {
    return {
      imageCredits: rule.imageCredits || 0,
      videoCredits: rule.videoCredits || 0,
    };
  }
  return {
    imageCredits: config.defaultImageDeduction || 0,
    videoCredits: config.defaultVideoDeduction || 0,
  };
}

async function getActiveCreditConfig() {
  return prisma.creditConfig.findFirst({
    where: { active: true },
    include: { deductions: true },
    orderBy: { createdAt: "asc" },
  });
}

async function resolveCost(generationType, duration = null) {
  const config = await getActiveCreditConfig();
  return resolveCostFromConfig(config, generationType, duration);
}

module.exports = {
  resolveCost,
  resolveCostFromConfig,
  getActiveCreditConfig,
};
