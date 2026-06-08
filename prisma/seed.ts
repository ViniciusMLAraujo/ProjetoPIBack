import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Utilitário: busca ou cria registro por campo único
async function findOrCreate<T>(
  findFn: () => Promise<T | null>,
  createFn: () => Promise<T>
): Promise<T> {
  return (await findFn()) ?? (await createFn());
}

async function main() {
  const hash = (plain: string) => bcrypt.hash(plain, 10);

  // ─── Admin ────────────────────────────────────────────────────────────────────
  await findOrCreate(
    () => prisma.user.findUnique({ where: { email: "admin@teste.com" } }),
    async () => prisma.user.create({ data: { email: "admin@teste.com", password: await hash("123456"), role: Role.ADMIN } })
  );

  // ─── Professores ──────────────────────────────────────────────────────────────
  await findOrCreate(
    () => prisma.user.findUnique({ where: { email: "professor@teste.com" } }),
    async () => prisma.user.create({ data: { email: "professor@teste.com", password: await hash("123456"), role: Role.PROFESSOR } })
  );
  await findOrCreate(
    () => prisma.user.findUnique({ where: { email: "professora@teste.com" } }),
    async () => prisma.user.create({ data: { email: "professora@teste.com", password: await hash("123456"), role: Role.PROFESSOR } })
  );

  // ─── Salas ────────────────────────────────────────────────────────────────────
  const sala101 = await findOrCreate(
    () => prisma.room.findFirst({ where: { name: "Sala 101" } }),
    () => prisma.room.create({ data: { name: "Sala 101", capacity: 40 } })
  );
  const sala102 = await findOrCreate(
    () => prisma.room.findFirst({ where: { name: "Sala 102" } }),
    () => prisma.room.create({ data: { name: "Sala 102", capacity: 35 } })
  );
  const labInfo = await findOrCreate(
    () => prisma.room.findFirst({ where: { name: "Lab Informática" } }),
    () => prisma.room.create({ data: { name: "Lab Informática", capacity: 30 } })
  );

  // ─── Cursos ───────────────────────────────────────────────────────────────────
  const engSoftware = await findOrCreate(
    () => prisma.course.findUnique({ where: { code: "ES101" } }),
    () => prisma.course.create({ data: { name: "Engenharia de Software", code: "ES101" } })
  );
  const redesComp = await findOrCreate(
    () => prisma.course.findUnique({ where: { code: "RC201" } }),
    () => prisma.course.create({ data: { name: "Redes de Computadores", code: "RC201" } })
  );
  const banco = await findOrCreate(
    () => prisma.course.findUnique({ where: { code: "BD301" } }),
    () => prisma.course.create({ data: { name: "Banco de Dados", code: "BD301" } })
  );

  // ─── Horários (1 por curso, busca por courseId+dayOfWeek+startTime) ───────────
  const horES = await findOrCreate(
    () => prisma.schedule.findFirst({ where: { courseId: engSoftware.id, dayOfWeek: 1, startTime: "08:00" } }),
    () => prisma.schedule.create({ data: { courseId: engSoftware.id, roomId: sala101.id, dayOfWeek: 1, startTime: "08:00", endTime: "10:00" } })
  );
  const horRC = await findOrCreate(
    () => prisma.schedule.findFirst({ where: { courseId: redesComp.id, dayOfWeek: 3, startTime: "10:00" } }),
    () => prisma.schedule.create({ data: { courseId: redesComp.id, roomId: sala102.id, dayOfWeek: 3, startTime: "10:00", endTime: "12:00" } })
  );
  const horBD = await findOrCreate(
    () => prisma.schedule.findFirst({ where: { courseId: banco.id, dayOfWeek: 5, startTime: "14:00" } }),
    () => prisma.schedule.create({ data: { courseId: banco.id, roomId: labInfo.id, dayOfWeek: 5, startTime: "14:00", endTime: "16:00" } })
  );

  // ─── Alunos ───────────────────────────────────────────────────────────────────
  const studentsData = [
    { email: "aluno1@teste.com", name: "João Silva",     enrollment: "2024001", courses: [engSoftware.id, banco.id] },
    { email: "aluno2@teste.com", name: "Maria Souza",    enrollment: "2024002", courses: [engSoftware.id, redesComp.id] },
    { email: "aluno3@teste.com", name: "Pedro Oliveira", enrollment: "2024003", courses: [redesComp.id, banco.id] },
    { email: "aluno4@teste.com", name: "Ana Costa",      enrollment: "2024004", courses: [engSoftware.id, redesComp.id, banco.id] },
    { email: "aluno5@teste.com", name: "Lucas Ferreira", enrollment: "2024005", courses: [engSoftware.id] },
  ];

  for (const sd of studentsData) {
    // User
    const user = await findOrCreate(
      () => prisma.user.findUnique({ where: { email: sd.email } }),
      async () => prisma.user.create({ data: { email: sd.email, password: await hash("123456"), role: Role.STUDENT } })
    );

    // Student
    const student = await findOrCreate(
      () => prisma.student.findUnique({ where: { userId: user.id } }),
      async () => {
        // garante que a matrícula também não existe antes de criar
        const byEnrollment = await prisma.student.findUnique({ where: { enrollment: sd.enrollment } });
        if (byEnrollment) return byEnrollment;
        return prisma.student.create({ data: { name: sd.name, enrollment: sd.enrollment, userId: user.id } });
      }
    );

    // Matrículas (ignora duplicatas silenciosamente)
    for (const courseId of sd.courses) {
      const exists = await prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId: student.id, courseId } },
      });
      if (!exists) {
        await prisma.enrollment.create({ data: { studentId: student.id, courseId } });
      }
    }
  }

  console.log("\n✅ Seed concluído!\n");
  console.log("┌──────────────┬────────────────────────────┬──────────┬──────────────────────────────┐");
  console.log("│ Role         │ Email                      │ Senha    │ Observação                   │");
  console.log("├──────────────┼────────────────────────────┼──────────┼──────────────────────────────┤");
  console.log("│ ADMIN        │ admin@teste.com            │ 123456   │ Acesso total                 │");
  console.log("│ PROFESSOR    │ professor@teste.com        │ 123456   │                              │");
  console.log("│ PROFESSOR    │ professora@teste.com       │ 123456   │                              │");
  console.log("│ STUDENT      │ aluno1@teste.com           │ 123456   │ Matrícula 2024001            │");
  console.log("│ STUDENT      │ aluno2@teste.com           │ 123456   │ Matrícula 2024002            │");
  console.log("│ STUDENT      │ aluno3@teste.com           │ 123456   │ Matrícula 2024003            │");
  console.log("│ STUDENT      │ aluno4@teste.com           │ 123456   │ Matrícula 2024004 (3 cursos) │");
  console.log("│ STUDENT      │ aluno5@teste.com           │ 123456   │ Matrícula 2024005            │");
  console.log("└──────────────┴────────────────────────────┴──────────┴──────────────────────────────┘");
  console.log("\nHorários criados:");
  console.log(`  ES101 – Sala 101  – Segunda  08:00-10:00  (id: ${horES.id})`);
  console.log(`  RC201 – Sala 102  – Quarta   10:00-12:00  (id: ${horRC.id})`);
  console.log(`  BD301 – Lab Info  – Sexta    14:00-16:00  (id: ${horBD.id})\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
