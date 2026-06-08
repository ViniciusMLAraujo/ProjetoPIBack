import { Router, Request, Response, NextFunction } from 'express'
import { login } from './auth.service'
import { loginSchema } from './auth.validation'
import { authMiddleware } from '../../shared/middlewares/auth.middleware'

const router = Router()


router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors })
      return
    }

    const { email, password } = parsed.data
    const result = await login(email, password)
    res.json(result)
  } catch (err) {
    next(err)
  }
})


router.get('/me', authMiddleware, (req: Request, res: Response) => {
  res.json({ user: req.user })
})

export default router