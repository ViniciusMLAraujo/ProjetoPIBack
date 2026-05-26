// src/__tests__/access.service.test.ts
import { registerExit, getStudentHistory, getAttendance } from '../modules/access/access.service'

// Mock do Prisma
jest.mock('../config/prisma', () => ({
  prisma: {
    accessLog: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
    student: { findUnique: jest.fn() },
    enrollment: { findUnique: jest.fn() },
    qRToken: { findMany: jest.fn() },
  },
}))

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { prisma } = require('../config/prisma')

const mockStudent = { id: 'student-1', name: 'João Silva', enrollment: '2024001' }

describe('AccessService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ─── registerExit ──────────────────────────────────────────────────────────

  describe('registerExit()', () => {
    it('deve registrar saída com sucesso', async () => {
      const log = { id: 'log-1', exitAt: null, enteredAt: new Date() }
      prisma.accessLog.findUnique.mockResolvedValue(log)
      prisma.accessLog.update.mockResolvedValue({ ...log, exitAt: new Date() })

      const result = await registerExit('log-1')
      expect(result.exitAt).toBeDefined()
      expect(prisma.accessLog.update).toHaveBeenCalledTimes(1)
    })

    it('deve ser idempotente — não atualizar se saída já registrada', async () => {
      const log = { id: 'log-1', exitAt: new Date(), enteredAt: new Date() }
      prisma.accessLog.findUnique.mockResolvedValue(log)

      await registerExit('log-1')
      expect(prisma.accessLog.update).not.toHaveBeenCalled()
    })

    it('deve lançar erro para log inexistente', async () => {
      prisma.accessLog.findUnique.mockResolvedValue(null)

      await expect(registerExit('nao-existe')).rejects.toThrow('Registro de acesso não encontrado')
    })
  })

  // ─── getStudentHistory ─────────────────────────────────────────────────────

  describe('getStudentHistory()', () => {
    it('deve retornar histórico com duração calculada em minutos', async () => {
      const enteredAt = new Date('2026-05-19T08:00:00Z')
      const exitAt = new Date('2026-05-19T10:00:00Z')

      prisma.student.findUnique.mockResolvedValue(mockStudent)
      prisma.accessLog.findMany.mockResolvedValue([{
        id: 'log-1', enteredAt, exitAt,
        qrToken: {
          schedule: {
            dayOfWeek: 1, startTime: '08:00', endTime: '10:00',
            course: { id: 'c1', name: 'Ciência da Computação', code: 'CC-2024' },
            room: { name: 'Lab 01' },
          },
        },
      }])

      const result = await getStudentHistory('student-1')

      expect(result.total).toBe(1)
      expect(result.accesses[0].duration).toBe(120) // 2h em minutos
    })

    it('deve retornar duration null se aluno ainda está dentro', async () => {
      prisma.student.findUnique.mockResolvedValue(mockStudent)
      prisma.accessLog.findMany.mockResolvedValue([{
        id: 'log-2', enteredAt: new Date(), exitAt: null,
        qrToken: {
          schedule: {
            dayOfWeek: 1, startTime: '08:00', endTime: '10:00',
            course: { id: 'c1', name: 'CC', code: 'CC-2024' },
            room: { name: 'Lab 01' },
          },
        },
      }])

      const result = await getStudentHistory('student-1')
      expect(result.accesses[0].duration).toBeNull()
    })

    it('deve lançar erro para aluno inexistente', async () => {
      prisma.student.findUnique.mockResolvedValue(null)
      await expect(getStudentHistory('nao-existe')).rejects.toThrow('Aluno não encontrado')
    })
  })

  // ─── getAttendance ─────────────────────────────────────────────────────────

  describe('getAttendance()', () => {
    it('deve calcular taxa de presença corretamente', async () => {
      prisma.student.findUnique.mockResolvedValue(mockStudent)
      prisma.enrollment.findUnique.mockResolvedValue({ studentId: 'student-1', courseId: 'c1' })
      prisma.qRToken.findMany.mockResolvedValue([
        { createdAt: new Date(), schedule: { dayOfWeek: 1, startTime: '08:00', endTime: '10:00' }, access: { id: 'log-1' } },
        { createdAt: new Date(), schedule: { dayOfWeek: 1, startTime: '08:00', endTime: '10:00' }, access: null },
        { createdAt: new Date(), schedule: { dayOfWeek: 1, startTime: '08:00', endTime: '10:00' }, access: { id: 'log-3' } },
      ])

      const result = await getAttendance('student-1', 'c1')

      expect(result.summary.totalClasses).toBe(3)
      expect(result.summary.attended).toBe(2)
      expect(result.summary.absences).toBe(1)
      expect(result.summary.attendanceRate).toBe(67)
    })

    it('deve lançar erro se aluno não está matriculado', async () => {
      prisma.student.findUnique.mockResolvedValue(mockStudent)
      prisma.enrollment.findUnique.mockResolvedValue(null)

      await expect(getAttendance('student-1', 'outro-curso')).rejects.toThrow('Aluno não matriculado')
    })

    it('deve lançar erro para aluno inexistente', async () => {
      prisma.student.findUnique.mockResolvedValue(null)
      await expect(getAttendance('nao-existe', 'c1')).rejects.toThrow('Aluno não encontrado')
    })
  })
})
