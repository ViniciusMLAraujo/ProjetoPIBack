import { prisma } from '../../config/prisma'

interface CreateScheduleDTO {
  courseId: string
  roomId: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

interface UpdateScheduleDTO {
  courseId?: string
  roomId?: string
  dayOfWeek?: number
  startTime?: string
  endTime?: string
}

function isValidTime(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time)
}

function isStartBeforeEnd(start: string, end: string): boolean {
  return start < end
}

function validateScheduleData(data: Partial<CreateScheduleDTO>) {
  if (data.dayOfWeek !== undefined) {
    if (!Number.isInteger(data.dayOfWeek) || data.dayOfWeek < 0 || data.dayOfWeek > 6) {
      throw new Error('dayOfWeek deve ser um inteiro entre 0 (Domingo) e 6 (Sábado)')
    }
  }

  if (data.startTime && !isValidTime(data.startTime)) {
    throw new Error('startTime deve estar no formato HH:MM (ex: "08:00")')
  }

  if (data.endTime && !isValidTime(data.endTime)) {
    throw new Error('endTime deve estar no formato HH:MM (ex: "10:00")')
  }

  if (data.startTime && data.endTime && !isStartBeforeEnd(data.startTime, data.endTime)) {
    throw new Error('startTime deve ser anterior ao endTime')
  }
}

export async function getAllSchedules() {
  return prisma.schedule.findMany({
    include: { room: true, course: true },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  })
}

export async function getScheduleById(id: string) {
  const schedule = await prisma.schedule.findUnique({
    where: { id },
    include: { room: true, course: true },
  })

  if (!schedule) throw new Error('Horário não encontrado')
  return schedule
}

export async function createSchedule(data: CreateScheduleDTO) {
  validateScheduleData(data)

  const room = await prisma.room.findUnique({ where: { id: data.roomId } })
  if (!room) throw new Error('Sala não encontrada')

  const course = await prisma.course.findUnique({ where: { id: data.courseId } })
  if (!course) throw new Error('Curso não encontrado')

  return prisma.schedule.create({
    data,
    include: { room: true, course: true },
  })
}

export async function updateSchedule(id: string, data: UpdateScheduleDTO) {
  await getScheduleById(id)
  validateScheduleData(data)

  if (data.roomId) {
    const room = await prisma.room.findUnique({ where: { id: data.roomId } })
    if (!room) throw new Error('Sala não encontrada')
  }

  if (data.courseId) {
    const course = await prisma.course.findUnique({ where: { id: data.courseId } })
    if (!course) throw new Error('Curso não encontrado')
  }

  return prisma.schedule.update({
    where: { id },
    data,
    include: { room: true, course: true },
  })
}

export async function deleteSchedule(id: string) {
  await getScheduleById(id)
  return prisma.schedule.delete({ where: { id } })
}
