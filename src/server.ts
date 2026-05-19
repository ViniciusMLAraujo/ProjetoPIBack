import express from 'express'
import { env } from './config/env'
import { errorMiddleware } from './shared/middlewares/error.middleware'
import authRoutes from './modules/auth/auth.routes'

const app = express()

app.use(express.json())


app.use('/api/auth', authRoutes)


app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})


app.use(errorMiddleware)

if (process.env.NODE_ENV !== 'test') {
  app.listen(env.PORT, () => {
    console.log(`🚀 Server running on port ${env.PORT}`)
  })
}

export default app
