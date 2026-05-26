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
import accessRoutes from './modules/access/access.routes'

const app = express()

app.use(helmet())

const globalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
})
app.use(globalLimiter)

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Muitas tentativas de login. Aguarde 15 minutos.' },
})

app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/students', studentsRoutes)
app.use('/api/courses', coursesRoutes)
app.use('/api/rooms', roomsRoutes)
app.use('/api/schedules', schedulesRoutes)
app.use('/api/access', accessRoutes)

app.use(errorMiddleware)

if (process.env.NODE_ENV !== 'test') {
  initMQTT()
  app.listen(env.PORT, () => {
    console.log(`🚀 Server running on port ${env.PORT}`)
  })
}

export default app
