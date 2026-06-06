import mqtt, { MqttClient } from 'mqtt'
import { env } from '../../config/env'
import { prisma } from '../../config/prisma'


export const TOPICS = {
  SCAN: 'catraca/scan',       
  COMMAND: 'catraca/command', 
  STATUS: 'catraca/status',   
} as const

interface ScanPayload {
  token: string      
  studentId: string  
  deviceId: string   
}

interface CommandPayload {
  action: 'OPEN' | 'DENY'
  deviceId: string
  studentName?: string
  reason?: string
}

let client: MqttClient | null = null

export function initMQTT(): MqttClient {
  if (client) return client

  client = mqtt.connect(env.MQTT_BROKER_URL, {
    clientId: `backend-${process.pid}`,
    clean: true,
    reconnectPeriod: 3000,
    connectTimeout: 10000,
  })

  client.on('connect', () => {
    console.log(`📡 MQTT conectado: ${env.MQTT_BROKER_URL}`)
    client!.subscribe([TOPICS.SCAN, TOPICS.STATUS], (err) => {
      if (err) console.error('❌ Erro ao subscrever tópicos MQTT:', err)
      else console.log(`✅ Subscrito: ${TOPICS.SCAN}, ${TOPICS.STATUS}`)
    })
  })

  client.on('message', async (topic, message) => {
    try {
      const payload = JSON.parse(message.toString())
      if (topic === TOPICS.SCAN) await handleScan(payload as ScanPayload)
      if (topic === TOPICS.STATUS) console.log(`📟 ESP32 [${payload.deviceId}]: ${payload.status}`)
    } catch (err) {
      console.error(`❌ Erro ao processar mensagem MQTT [${topic}]:`, err)
    }
  })

  client.on('error', (err) => console.error('❌ Erro MQTT:', err.message))
  client.on('offline', () => console.warn('⚠️  MQTT offline — reconectando...'))
  client.on('reconnect', () => console.log('🔄 MQTT reconectando...'))

  return client
}


async function handleScan({ token, studentId, deviceId }: ScanPayload) {
  console.log(`🔍 Scan [${deviceId}] token: ${token.slice(0, 8)}...`)

  const command: CommandPayload = { action: 'DENY', deviceId }

  try {
    const qrToken = await prisma.qRToken.findUnique({
      where: { token },
      include: {
        schedule: {
          include: { course: { select: { id: true, name: true } } },
        },
      },
    })

    if (!qrToken) throw new Error('QR Code inválido')
    if (new Date() > qrToken.expiresAt) throw new Error('QR Code expirado')
    if (qrToken.usedAt) throw new Error('QR Code já utilizado')

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId: qrToken.schedule.courseId,
        },
      },
    })
    if (!enrollment) throw new Error('Aluno não matriculado neste curso')

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { name: true },
    })
    if (!student) throw new Error('Aluno não encontrado')

    await prisma.$transaction([
      prisma.qRToken.update({ where: { token }, data: { usedAt: new Date() } }),
      prisma.accessLog.create({ data: { studentId, qrTokenId: qrToken.id } }),
    ])

    command.action = 'OPEN'
    command.studentName = student.name
    console.log(`✅ Acesso liberado: ${student.name} — ${qrToken.schedule.course.name}`)
  } catch (err: unknown) {
    command.reason = err instanceof Error ? err.message : 'Erro desconhecido'
    console.warn(`⛔ Acesso negado [${deviceId}]: ${command.reason}`)
  }

  client!.publish(TOPICS.COMMAND, JSON.stringify(command), { qos: 1 })
}


export function publishCommand(deviceId: string, action: 'OPEN' | 'DENY', reason?: string) {
  if (!client?.connected) {
    console.warn('⚠️  MQTT não conectado')
    return
  }
  client.publish(TOPICS.COMMAND, JSON.stringify({ action, deviceId, reason }), { qos: 1 })
}


export function getMQTTClient() {
  return client
}