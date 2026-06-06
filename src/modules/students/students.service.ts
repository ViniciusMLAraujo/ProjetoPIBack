import { prisma } from '../../config/prisma'
import { CreateStudentInput, EnrollStudentInput } from './students.validation'
import bcrypt from 'bcryptjs'

export async function getAllStudents() {
  return prisma.student.findMany({
    select: {
      id: true,
      name: true,
      enrollment: true,
      user: {
        select: { email: true, createdAt: true },
      },
      courses: {
        select: {
          course: {
            select: { id: true, name: true, code: true },
          },
        },
      },
    },
  })
}

export async function getStudentById(id: string) {
  const student = await prisma.student.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      enrollment: true,
      user: {
        select: { email: true, createdAt: true },
      },
      courses: {
        select: {
          course: {
            select: { id: true, name: true, code: true },
          },
        },
      },
    },
  })

  if (!student) throw new Error('Aluno não encontrado')
  return student
}

export async function createStudent(data: CreateStudentInput) {
  const emailExistente = await prisma.user.findUnique({ where: { email: data.email } })
  if (emailExistente) throw new Error('E-mail já cadastrado')

  const matriculaExistente = await prisma.student.findUnique({ where: { enrollment: data.enrollment } })
  if (matriculaExistente) throw new Error('Matrícula já cadastrada')

  const hashedPassword = await bcrypt.hash(data.password, 10)

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: 'STUDENT',
      },
    })

    const student = await tx.student.create({
      data: {
        name: data.name,
        enrollment: data.enrollment,
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
        enrollment: true,
        user: { select: { email: true } },
      },
    })

    return student
  })
}

// Retorna perfil completo + horários do aluno logado (via userId do JWT)
export async function getStudentProfile(userId: string) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: {
      id: true,
      name: true,
      enrollment: true,
      user: { select: { email: true } },
      courses: {
        select: {
          course: {
            select: {
              id: true,
              name: true,
              code: true,
              schedules: {
                select: {
                  id: true,
                  dayOfWeek: true,
                  startTime: true,
                  endTime: true,
                  room: { select: { name: true } },
                },
                orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
              },
            },
          },
        },
      },
    },
  })
  if (!student) throw new Error('Aluno não encontrado')
  return student
}

export async function enrollStudent(studentId: string, data: EnrollStudentInput) {
  const student = await prisma.student.findUnique({ where: { id: studentId } })
  if (!student) throw new Error('Aluno não encontrado')

  const course = await prisma.course.findUnique({ where: { id: data.courseId } })
  if (!course) throw new Error('Curso não encontrado')

  const existing = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId: data.courseId } },
  })
  if (existing) throw new Error('Aluno já matriculado neste curso')

  return prisma.enrollment.create({
    data: { studentId, courseId: data.courseId },
  })
}
