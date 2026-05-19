import { prisma } from '../../config/prisma'
import { CreateCourseInput } from './courses.validation'

export async function getAllCourses() {
  return prisma.course.findMany({
    select: {
      id: true,
      name: true,
      code: true,
      enrollments: {
        select: {
          student: { select: { id: true, name: true } },
        },
      },
    },
  })
}

export async function getCourseById(id: string) {
  const course = await prisma.course.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      code: true,
      enrollments: {
        select: {
          student: { select: { id: true, name: true, enrollment: true } },
        },
      },
      schedules: {
        select: {
          id: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          room: { select: { name: true } },
        },
      },
    },
  })

  if (!course) throw new Error('Curso não encontrado')
  return course
}

export async function createCourse(data: CreateCourseInput) {
  const existing = await prisma.course.findUnique({ where: { code: data.code } })
  if (existing) throw new Error('Código de curso já cadastrado')

  return prisma.course.create({
    data: { name: data.name, code: data.code },
    select: { id: true, name: true, code: true },
  })
}