import { prisma } from '../../config/prisma'
import { CreateStudentInput, EnrollStudentInput } from './students.validation'
import bcrypt from 'bcrypt'

// Lista todos os alunos com seus dados de usuário
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

// Busca um aluno pelo ID do Student (não do User)
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

// Cria User (email/senha/role) + Student (nome/matrícula) numa transação
// Transação = se qualquer parte falhar, nada é salvo no banco
export async function createStudent(data: CreateStudentInput) {
  const emailExistente = await prisma.user.findUnique({
    where: { email: data.email },
  })
  if (emailExistente) throw new Error('E-mail já cadastrado')

  const matriculaExistente = await prisma.student.findUnique({
    where: { enrollment: data.enrollment },
  })
  if (matriculaExistente) throw new Error('Matrícula já cadastrada')

  const hashedPassword = await bcrypt.hash(data.password, 10)

  // prisma.$transaction garante que User e Student são criados juntos
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

// Matricula um aluno em um curso (cria Enrollment)
export async function enrollStudent(studentId: string, data: EnrollStudentInput) {
  // Verifica se aluno existe
  const student = await prisma.student.findUnique({ where: { id: studentId } })
  if (!student) throw new Error('Aluno não encontrado')

  // Verifica se curso existe
  const course = await prisma.course.findUnique({ where: { id: data.courseId } })
  if (!course) throw new Error('Curso não encontrado')

  // Verifica se já está matriculado
  const jaMatriculado = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: { studentId, courseId: data.courseId },
    },
  })
  if (jaMatriculado) throw new Error('Aluno já matriculado neste curso')

  return prisma.enrollment.create({
    data: { studentId, courseId: data.courseId },
    select: {
      student: { select: { name: true } },
      course: { select: { name: true, code: true } },
    },
  })
}