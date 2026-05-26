import QRCode from 'qrcode'
import { prisma } from '../../config/prisma'
import crypto from 'crypto'

// ─── Gerar QR Code ────────────────────────────────────────────────────────────
export async function generateQRCode(userId: string, scheduleId: string) {

  // 1. Busca o Student vinculado ao User (JWT só tem userId)
  const student = await prisma.student.findUnique({
    where: { userId },
  })
  if (!student) throw new Error('Aluno não encontrado para este usuário')

  // 2. Verifica se o horário existe
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: {
      course: { select: { id: true, name: true } },
      room: { select: { name: true } },
    },
  })
  if (!schedule) throw new Error('Horário não encontrado')

  // 3. Verifica se o aluno está matriculado no curso desse horário
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: student.id,
        courseId: schedule.courseId,
      },
    },
  })
  if (!enrollment) throw new Error('Aluno não matriculado neste curso')

  // 4. Invalida tokens anteriores válidos deste aluno para este horário
  // Garante que só existe um QR ativo por vez
  await prisma.qRToken.updateMany({
    where: {
      studentId: student.id,
      scheduleId,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: { expiresAt: new Date() },
  })

  // 5. Gera token único e define expiração de 5 minutos
  const rawToken = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

  // 6. Salva o token no banco
  await prisma.qRToken.create({
    data: {
      token: rawToken,
      studentId: student.id,
      scheduleId,
      expiresAt,
    },
  })

  // 7. Gera imagem QR Code em base64 para mostrar no app
  const qrImage = await QRCode.toDataURL(rawToken)

  return {
    token: rawToken,
    expiresAt,
    qrImage, // imagem pronta para o app exibir
    schedule: {
      course: schedule.course.name,
      room: schedule.room.name,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    },
  }
}

// ─── Validar QR Code ──────────────────────────────────────────────────────────
// Chamado quando o ESP32 lê o QR e manda o token para o backend
export async function validateQRCode(token: string) {

  // Busca tudo numa única query para melhor performance
  const qrToken = await prisma.qRToken.findUnique({
    where: { token },
    include: {
      student: {
        select: { id: true, name: true, enrollment: true },
      },
      schedule: {
        include: {
          course: { select: { name: true, code: true } },
          room: { select: { name: true } },
        },
      },
    },
  })

  // Token não existe
  if (!qrToken) {
    return { valid: false, action: 'DENY', reason: 'Token não encontrado' }
  }

  // Token já foi usado
  if (qrToken.usedAt !== null) {
    return { valid: false, action: 'DENY', reason: 'Token já utilizado' }
  }

  // Token expirado
  if (new Date() > qrToken.expiresAt) {
    return { valid: false, action: 'DENY', reason: 'Token expirado' }
  }

  // Token válido — marca como usado e registra entrada na catraca
  // Transação garante que os dois acontecem juntos ou nenhum acontece
  await prisma.$transaction(async (tx) => {
    await tx.qRToken.update({
      where: { id: qrToken.id },
      data: { usedAt: new Date() },
    })

    await tx.accessLog.create({
      data: {
        studentId: qrToken.studentId!,
        qrTokenId: qrToken.id,
      },
    })
  })

  return {
    valid: true,
    action: 'OPEN',
    student: {
      id: qrToken.student?.id,
      name: qrToken.student?.name,
      enrollment: qrToken.student?.enrollment,
    },
    schedule: {
      course: qrToken.schedule.course.name,
      room: qrToken.schedule.room.name,
      startTime: qrToken.schedule.startTime,
      endTime: qrToken.schedule.endTime,
    },
  }
}

// ─── Checar status do token ───────────────────────────────────────────────────
// Consulta leve — só verifica se ainda é válido, sem consumir o token
// Isso é a otimização de performance: busca só os campos necessários
export async function checkQRStatus(token: string) {

  const qrToken = await prisma.qRToken.findUnique({
    where: { token },
    select: {
      expiresAt: true,
      usedAt: true,
      createdAt: true,
    },
  })

  if (!qrToken) return { valid: false, reason: 'Token não encontrado' }
  if (qrToken.usedAt) return { valid: false, reason: 'Token já utilizado' }
  if (new Date() > qrToken.expiresAt) return { valid: false, reason: 'Token expirado' }

  // Calcula segundos restantes até expirar
  const secondsRemaining = Math.floor(
    (qrToken.expiresAt.getTime() - Date.now()) / 1000
  )

  return {
    valid: true,
    secondsRemaining,
    expiresAt: qrToken.expiresAt,
    createdAt: qrToken.createdAt,
  }
}