import { Router, Request, Response } from 'express'
import multer from 'multer'
import { authMiddleware, requireRole } from '../../shared/middlewares/auth.middleware'
import * as QRCodeService from './qrcode.service'
import { decodeQRFromBuffer } from './qrcode.image'
import { Role } from '@prisma/client'

const router = Router()

// Multer em memória — não salva arquivo em disco
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Apenas imagens são aceitas'))
    } else {
      cb(null, true)
    }
  },
})

// POST /api/qrcode/generate
// Aluno autenticado gera seu QR para entrar na catraca
router.post(
  '/generate',
  authMiddleware,
  requireRole(Role.STUDENT),
  async (req: Request, res: Response) => {
    const { scheduleId } = req.body

    if (!scheduleId) {
      res.status(400).json({ error: 'scheduleId é obrigatório' })
      return
    }

    // req.user é tipado pelo authMiddleware — não precisa de cast
    const userId = req.user!.userId

    try {
      const result = await QRCodeService.generateQRCode(userId, scheduleId)
      res.status(201).json(result)
    } catch (error: any) {
      res.status(400).json({ error: error.message })
    }
  }
)

// POST /api/qrcode/validate
// Valida token via REST (para testes/admin). O fluxo real usa MQTT.
router.post(
  '/validate',
  authMiddleware,
  requireRole(Role.ADMIN),
  async (req: Request, res: Response) => {
    const { token } = req.body

    if (!token) {
      res.status(400).json({ error: 'token é obrigatório' })
      return
    }

    try {
      const result = await QRCodeService.validateQRCode(token)
      const status = result.action === 'OPEN' ? 200 : 403
      res.status(status).json(result)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
)

// GET /api/qrcode/status/:token
// Verifica validade do token sem consumi-lo (para o app exibir contador regressivo)
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

// POST /api/qrcode/scan-image
// Recebe imagem do QR Code enviada pela ESP32, decodifica e valida o token.
// Autenticação via header X-Device-Key (comparado com ESP32_DEVICE_KEY no .env).
// Body: multipart/form-data com campo "image" (JPEG/PNG) e campo opcional "deviceId".
router.post(
  '/scan-image',
  upload.single('image'),
  async (req: Request, res: Response) => {
    // Verificação simples de chave de dispositivo (ESP32 não usa JWT)
    const deviceKey = req.headers['x-device-key']
    const expectedKey = process.env.ESP32_DEVICE_KEY
    if (expectedKey && deviceKey !== expectedKey) {
      res.status(401).json({ action: 'DENY', reason: 'Chave de dispositivo inválida' })
      return
    }

    const deviceId: string = (req.body?.deviceId as string) ?? 'esp32-unknown'

    if (!req.file) {
      res.status(400).json({ action: 'DENY', reason: 'Imagem não enviada (campo "image" ausente)' })
      return
    }

    try {
      // 1. Decodifica o QR Code da imagem
      const token = await decodeQRFromBuffer(req.file.buffer)

      // 2. Valida o token extraído
      const result = await QRCodeService.validateQRCode(token)

      const status = result.action === 'OPEN' ? 200 : 403
      res.status(status).json({ ...result, deviceId })
    } catch (error: any) {
      // Imagem sem QR, QR ilegível ou token inválido
      res.status(400).json({
        action: 'DENY',
        reason: error.message ?? 'Erro ao processar imagem',
        deviceId,
      })
    }
  }
)

export default router
