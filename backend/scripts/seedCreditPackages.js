const { prisma } = require("../config/db");

const DEFAULT_PACKAGES = [
  {
    slug: "starter",
    name: "STARTER",
    priceCents: 10000,
    imageCredits: 500,
    videoCredits: 200,
    sortOrder: 0,
    highlight: false,
  },
  {
    slug: "pro",
    name: "PRO",
    priceCents: 30000,
    imageCredits: 2000,
    videoCredits: 800,
    sortOrder: 1,
    highlight: true,
  },
  {
    slug: "studio",
    name: "STUDIO",
    priceCents: 80000,
    imageCredits: 6000,
    videoCredits: 2500,
    sortOrder: 2,
    highlight: false,
  },
];

async function main() {
  for (const pkg of DEFAULT_PACKAGES) {
    await prisma.creditPackage.upsert({
      where: { slug: pkg.slug },
      create: pkg,
      update: {
        name: pkg.name,
        priceCents: pkg.priceCents,
        imageCredits: pkg.imageCredits,
        videoCredits: pkg.videoCredits,
        sortOrder: pkg.sortOrder,
        highlight: pkg.highlight,
        active: true,
      },
    });
  }
  console.log(`Seeded ${DEFAULT_PACKAGES.length} credit packages`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
