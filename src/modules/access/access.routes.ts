// src/modules/access/access.routes.ts
import { Router, Request, Response, NextFunction } from 'express'
import { authMiddleware, requireRole } from '../../shared/middlewares/auth.middleware'
import {
  registerExit,
  getStudentHistory,
  getAttendance,
  getRecentAccesses,
} from './access.service'

const router = Router()

// PATCH /api/access/:id/exit — registra saída do aluno
// Admin e Professor podem registrar manualmente
router.patch(
  '/:id/exit',
  authMiddleware,
  requireRole('ADMIN', 'PROFESSOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await registerExit(req.params.id)
      res.json(result)
    } catch (err) { next(err) }
  }
)

// GET /api/access/students/:studentId/history — histórico de acessos do aluno
// Aluno só vê o próprio; admin e professor veem qualquer um
router.get(
  '/students/:studentId/history',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentId } = req.params

      // Aluno só pode ver o próprio histórico
      if (req.user!.role === 'STUDENT') {
        const { prisma } = await import('../../config/prisma')
        const student = await prisma.student.findUnique({
          where: { userId: req.user!.userId },
          select: { id: true },
        })
        if (!student || student.id !== studentId) {
          res.status(403).json({ error: 'Sem permissão para este recurso' })
          return
        }
      }

      const result = await getStudentHistory(studentId)
      res.json(result)
    } catch (err) { next(err) }
  }
)

// GET /api/access/students/:studentId/attendance/:courseId — presenças e faltas
router.get(
  '/students/:studentId/attendance/:courseId',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentId, courseId } = req.params
      const result = await getAttendance(studentId, courseId)
      res.json(result)
    } catch (err) { next(err) }
  }
)

// GET /api/access/recent — últimos acessos (dashboard admin)
router.get(
  '/recent',
  authMiddleware,
  requireRole('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = Number(req.query.limit) || 50
      const result = await getRecentAccesses(limit)
      res.json(result)
    } catch (err) { next(err) }
  }
)

export default router
