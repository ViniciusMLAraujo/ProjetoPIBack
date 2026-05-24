import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { env } from './config/env'
import { errorMiddleware } from './shared/middlewares/error.middleware'
import { initMQTT } from './shared/mqtt/mqtt.client'
import authRoutes from './modules/auth/auth.routes'
import studentsRoutes from './modules/students/students.routes'
import coursesRoutes from './modules/courses/courses.routes'
import roomsRoutes from './modules/rooms/room.routes'
import schedulesRoutes from './modules/schedules/schedules.routes'

const app = express()

// ─── Segurança ────────────────────────────────────────────────────────────────
// Helmet define headers HTTP de segurança (XSS, MIME sniff, etc.)
app.use(helmet())

// Rate limit global — protege todos os endpoints
const globalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
})
app.use(globalLimiter)

// Rate limit restrito para autenticação — evita brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,                   // só 10 tentativas de login por IP a cada 15 min
  message: { error: 'Muitas tentativas de login. Aguarde 15 minutos.' },
})

// ─── Parsing ──────────────────────────────────────────────────────────────────
app.use(express.json())

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── Rotas ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes)   // rate limit mais restrito no login
app.use('/api/students', studentsRoutes)
app.use('/api/courses', coursesRoutes)
app.use('/api/rooms', roomsRoutes)
app.use('/api/schedules', schedulesRoutes)

// ─── Error handler — sempre o último ─────────────────────────────────────────
app.use(errorMiddleware)

// ─── Start ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  initMQTT() // conecta ao broker Mosquitto e começa a ouvir scans do ESP32

  app.listen(env.PORT, () => {
    console.log(`🚀 Server running on port ${env.PORT}`)
  })
}

export default app
