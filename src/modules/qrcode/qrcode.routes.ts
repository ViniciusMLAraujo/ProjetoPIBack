import { Router, Request, Response } from 'express'
import { authMiddleware, requireRole } from '../../shared/middlewares/auth.middleware'
import * as QRCodeService from './qrcode.service'
import { Role } from '@prisma/client'

const router = Router()

// POST /api/qrcode/generate
// Aluno autenticado gera seu QR para entrar na catraca
router.post(
  '/generate',
  authMiddleware,
  requireRole(Role.STUDENT),
  async (req: Request, res: Response) => {
    const { scheduleId } = req.body

    if (!scheduleId) {
      return res.status(400).json({ error: 'scheduleId é obrigatório' })
    }

    // userId vem do token JWT, populado pelo authMiddleware do Dev 1
    const userId = (req as any).user.userId

    try {
      const result = await QRCodeService.generateQRCode(userId, scheduleId)
      res.status(201).json(result)
    } catch (error: any) {
      res.status(400).json({ error: error.message })
    }
  }
)

// POST /api/qrcode/validate
// Valida o token lido pelo ESP32 na catraca
router.post(
  '/validate',
  authMiddleware,
  requireRole(Role.ADMIN),
  async (req: Request, res: Response) => {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ error: 'token é obrigatório' })
    }

    try {
      const result = await QRCodeService.validateQRCode(token)
      // OPEN = 200, DENY = 403
      const status = result.action === 'OPEN' ? 200 : 403
      res.status(status).json(result)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
)

// GET /api/qrcode/status/:token
// Verifica validade do token sem consumi-lo (otimização de performance)
// O app pode chamar esse endpoint para mostrar um contador regressivo
router.get(
  '/status/:token',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const result = await QRCodeService.checkQRStatus(req.params.token)
      res.json(result)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
)

export default router