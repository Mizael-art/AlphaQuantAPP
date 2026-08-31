import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@alphaquant.local";
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password) {
    throw new Error(
      "SEED_ADMIN_PASSWORD env var is required to seed the admin user — never hardcode a default password.",
    );
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  await prisma.adminUser.upsert({
    where: { email },
    create: { email, passwordHash, name: "AlphaQuant Admin", role: "SUPERADMIN" },
    update: { passwordHash },
  });
  console.log(`Seeded admin user: ${email}`);

  await prisma.equityPoint.upsert({
    where: { id: "seed-initial-equity" },
    create: { id: "seed-initial-equity", equity: 10000, highWaterMark: 10000 },
    update: {},
  });

  for (const service of ["api", "database", "market_data", "monitoring", "worker"]) {
    await prisma.systemHealth.upsert({
      where: { service },
      create: { service, status: "ONLINE" },
      update: {},
    });
  }

  const strategies = ["Breakout", "Mean Reversion", "Trend Following", "Liquidity Sweep"];
  for (const name of strategies) {
    await prisma.strategy.upsert({ where: { name }, create: { name }, update: {} });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
