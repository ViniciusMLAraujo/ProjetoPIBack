import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma";
import { env } from "../../config/env";
import { Role } from "@prisma/client";

const SALT_ROUNDS = 10;

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new Error("Usuário não encontrado");

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error("Senha incorreta");

  const token = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });

  return { token, role: user.role };
}

export async function createUser(
  email: string,
  password: string,
  role: Role = Role.STUDENT,
) {
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new Error("E-mail já cadastrado");

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { email, password: hashed, role },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  return user;
}


export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}