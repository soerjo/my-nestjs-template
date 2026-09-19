import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";
  const hashedPassword = bcrypt.hashSync(password, 10);

  const org = await prisma.organization.upsert({
    where: { slug: 'default' },
    update: {},
    create: { slug: 'default', name: 'Default Org' },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@local.test' },
    update: { role: 'ADMIN' },
    create: {
      email: 'admin@local.test',
      password: hashedPassword,
      role: 'ADMIN',
      organizationId: org.id,
    },
  });

  console.log(`Seeded organization ${org.slug} and admin ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });