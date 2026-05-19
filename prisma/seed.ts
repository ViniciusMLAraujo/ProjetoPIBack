import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash("123456", 10);

  await prisma.user.upsert({
    where: { email: "admin@teste.com" },
    update: {},
    create: {
      email: "admin@teste.com",
      password: hashed,
      role: Role.ADMIN,
    },
  });

  console.log("Seed concluído.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());