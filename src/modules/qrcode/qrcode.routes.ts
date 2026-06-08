import { Router, Request, Response } from 'express'
import multer from 'multer'
import rateLimit from 'express-rate-limit'
import { authMiddleware, requireRole } from '../../shared/middlewares/auth.middleware'
import * as QRCodeService from './qrcode.service'
import { decodeQRFromBuffer } from './qrcode.image'
import { Role } from '@prisma/client'

const router = Router()

// Rate limiter dedicado para scan-image (ESP32):
// Permite até 60 scans por minuto por IP (debounce do ESP32 é 2.5s → ~24/min em uso normal).
// Separado do globalLimiter (100/15min) para não bloquear o dispositivo.
const scanLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { action: 'DENY', reason: 'Muitas requisições de scan. Aguarde.' },
})

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

    const userId = req.user!.userId

    try {
      const result = await QRCodeService.generateQRCode(userId, scheduleId)
      console.log(`[QR] Gerado para user=${userId} schedule=${scheduleId}`)
      res.status(201).json(result)
    } catch (error: any) {
      console.warn(`[QR] Erro ao gerar: ${error.message}`)
      res.status(400).json({ error: error.message })
    }
  }
)

// POST /api/qrcode/validate
// Valida token via REST (para testes/admin). O fluxo real usa HTTP do ESP32.
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
// Recebe imagem JPEG do ESP32, decodifica o QR Code e valida o token.
// Autenticação: header X-Device-Key (ESP32 não usa JWT).
// Body: multipart/form-data com campo "image" (JPEG/PNG) e campo opcional "deviceId".
router.post(
  '/scan-image',
  scanLimiter,           // rate limiter dedicado — não depende do globalLimiter
  upload.single('image'),
  async (req: Request, res: Response) => {
    const deviceId: string = (req.body?.deviceId as string) ?? 'esp32-unknown'

    // Verificação de chave do dispositivo (ESP32 não usa JWT)
    const deviceKey = req.headers['x-device-key']
    const expectedKey = process.env.ESP32_DEVICE_KEY
    if (expectedKey && deviceKey !== expectedKey) {
      console.warn(`[SCAN] Chave inválida — device=${deviceId} ip=${req.ip}`)
      res.status(401).json({ action: 'DENY', reason: 'Chave de dispositivo inválida' })
      return
    }

    if (!req.file) {
      console.warn(`[SCAN] Imagem ausente — device=${deviceId}`)
      res.status(400).json({ action: 'DENY', reason: 'Imagem não enviada (campo "image" ausente)' })
      return
    }

    console.log(`[SCAN] device=${deviceId} size=${req.file.size}B mime=${req.file.mimetype}`)

    try {
      // 1. Decodifica o QR Code da imagem
      const token = await decodeQRFromBuffer(req.file.buffer)
      console.log(`[SCAN] QR decodificado — token=${token.slice(0, 8)}... device=${deviceId}`)

      // 2. Valida o token extraído
      const result = await QRCodeService.validateQRCode(token)

      if (result.action === 'OPEN') {
        console.log(`[SCAN] ✅ ACESSO LIBERADO — device=${deviceId} student=${(result as any).student?.name}`)
      } else {
        console.log(`[SCAN] ❌ ACESSO NEGADO — device=${deviceId} reason=${(result as any).reason}`)
      }

      const status = result.action === 'OPEN' ? 200 : 403
      res.status(status).json({ ...result, deviceId })
    } catch (error: any) {
      const reason = error.message ?? 'Erro ao processar imagem'
      console.warn(`[SCAN] Erro — device=${deviceId}: ${reason}`)
      res.status(400).json({
        action: 'DENY',
        reason,
        deviceId,
      })
    }
  }
)

export default router
