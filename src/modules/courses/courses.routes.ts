import { Router, Request, Response } from 'express'
import { authMiddleware, requireRole } from '../../shared/middlewares/auth.middleware'
import { createCourseSchema } from './courses.validation'
import * as CoursesService from './courses.service'
import { Role } from '@prisma/client'

const router = Router()

// GET /api/courses — qualquer usuário autenticado
router.get(
  '/',
  authMiddleware,
  async (_req: Request, res: Response) => {
    try {
      const courses = await CoursesService.getAllCourses()
      res.json(courses)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
)

// GET /api/courses/:id — qualquer usuário autenticado
router.get(
  '/:id',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const course = await CoursesService.getCourseById(req.params.id)
      res.json(course)
    } catch (error: any) {
      res.status(404).json({ error: error.message })
    }
  }
)

// POST /api/courses — apenas Admin
router.post(
  '/',
  authMiddleware,
  requireRole(Role.ADMIN),
  async (req: Request, res: Response) => {
    const parsed = createCourseSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten() })
      return
    }

    try {
      const course = await CoursesService.createCourse(parsed.data)
      res.status(201).json(course)
    } catch (error: any) {
      res.status(409).json({ error: error.message })
    }
  }
)

export default router
