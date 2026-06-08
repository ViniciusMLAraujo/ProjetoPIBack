// src/modules/access/access.service.ts
import { prisma } from '../../config/prisma'

// ─── Registrar saída ──────────────────────────────────────────────────────────
// Idempotente: se a saída já foi registrada, retorna o log sem atualizar

export async function registerExit(accessLogId: string) {
  const log = await prisma.accessLog.findUnique({ where: { id: accessLogId } })
  if (!log) throw new Error('Registro de acesso não encontrado')
  if (log.exitAt) return log // já saiu, não atualiza

  return prisma.accessLog.update({
    where: { id: accessLogId },
    data: { exitAt: new Date() },
  })
}

// ─── Histórico de acessos de um aluno ────────────────────────────────────────

export async function getStudentHistory(studentId: string) {
  const student = await prisma.student.findUnique({ where: { id: studentId } })
  if (!student) throw new Error('Aluno não encontrado')

  const logs = await prisma.accessLog.findMany({
    where: { studentId },
    orderBy: { enteredAt: 'desc' },
    include: {
      qrToken: {
        include: {
          schedule: {
            include: {
              course: { select: { id: true, name: true, code: true } },
              room:   { select: { name: true } },
            },
          },
        },
      },
    },
  })

  return {
    student: { id: student.id, name: student.name, enrollment: student.enrollment },
    total: logs.length,
    accesses: logs.map((log) => ({
      id:        log.id,
      enteredAt: log.enteredAt,
      exitAt:    log.exitAt,
      // duração em minutos — null se aluno ainda está dentro
      duration: log.exitAt
        ? Math.round((log.exitAt.getTime() - log.enteredAt.getTime()) / 60000)
        : null,
      course:   log.qrToken.schedule.course,
      room:     log.qrToken.schedule.room,
      schedule: {
        dayOfWeek: log.qrToken.schedule.dayOfWeek,
        startTime: log.qrToken.schedule.startTime,
        endTime:   log.qrToken.schedule.endTime,
      },
    })),
  }
}

// ─── Presenças e faltas de um aluno em um curso ───────────────────────────────
// Compara todos os QR tokens gerados para o curso (= aulas que ocorreram)
// com os acessos do aluno, calculando presença e taxa de frequência

export async function getAttendance(studentId: string, courseId: string) {
  const student = await prisma.student.findUnique({ where: { id: studentId } })
  if (!student) throw new Error('Aluno não encontrado')

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  })
  if (!enrollment) throw new Error('Aluno não matriculado neste curso')

  // Todos os tokens já expirados do curso = aulas que aconteceram
  const allTokens = await prisma.qRToken.findMany({
    where: {
      schedule: { courseId },
      expiresAt: { lt: new Date() },
    },
    include: {
      schedule: { select: { dayOfWeek: true, startTime: true, endTime: true } },
      access: {
        where: { studentId },
        select: { id: true, enteredAt: true, exitAt: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  const classes = allTokens.map((t) => ({
    date:      t.createdAt,
    schedule:  t.schedule,
    present:   t.access !== null,
    accessLog: t.access ?? null,
  }))

  const totalClasses    = classes.length
  const attended        = classes.filter((c) => c.present).length
  const absences        = totalClasses - attended
  const attendanceRate  = totalClasses > 0
    ? Math.round((attended / totalClasses) * 100)
    : 0

  return {
    student: { id: student.id, name: student.name, enrollment: student.enrollment },
    courseId,
    summary: { totalClasses, attended, absences, attendanceRate },
    classes,
  }
}

// ─── Acessos recentes — dashboard do admin ────────────────────────────────────

export async function getRecentAccesses(limit = 50) {
  const logs = await prisma.accessLog.findMany({
    take: limit,
    orderBy: { enteredAt: 'desc' },
    include: {
      student: { select: { id: true, name: true, enrollment: true } },
      qrToken: {
        include: {
          schedule: {
            include: {
              course: { select: { name: true, code: true } },
              room:   { select: { name: true } },
            },
          },
        },
      },
    },
  })

  return logs.map((log) => ({
    id:        log.id,
    enteredAt: log.enteredAt,
    exitAt:    log.exitAt,
    student:   log.student,
    course:    log.qrToken.schedule.course,
    room:      log.qrToken.schedule.room,
  }))
}