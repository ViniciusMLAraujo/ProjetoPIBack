import { Router, Request, Response } from 'express'
import { authMiddleware, requireRole } from '../../shared/middlewares/auth.middleware'
import { createStudentSchema, enrollStudentSchema } from './students.validation'
import * as StudentsService from './students.service'
import { Role } from '@prisma/client'

const router = Router()

// GET /api/students/me — aluno logado obtém seu próprio perfil + horários
router.get(
  '/me',
  authMiddleware,
  requireRole(Role.STUDENT),
  async (req: Request, res: Response) => {
    try {
      const profile = await StudentsService.getStudentProfile(req.user!.userId)
      res.json(profile)
    } catch (error: any) {
      res.status(404).json({ error: error.message })
    }
  }
)

// GET /api/students — Admin e Professor listam todos os alunos
router.get(
  '/',
  authMiddleware,
  requireRole(Role.ADMIN, Role.PROFESSOR),
  async (_req: Request, res: Response) => {
    try {
      const students = await StudentsService.getAllStudents()
      res.json(students)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
)

// GET /api/students/:id — Admin e Professor buscam aluno por ID
router.get(
  '/:id',
  authMiddleware,
  requireRole(Role.ADMIN, Role.PROFESSOR),
  async (req: Request, res: Response) => {
    try {
      const student = await StudentsService.getStudentById(req.params.id)
      res.json(student)
    } catch (error: any) {
      res.status(404).json({ error: error.message })
    }
  }
)

// POST /api/students — apenas Admin cria novos alunos
router.post(
  '/',
  authMiddleware,
  requireRole(Role.ADMIN),
  async (req: Request, res: Response) => {
    const parsed = createStudentSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten() })
      return
    }

    try {
      const student = await StudentsService.createStudent(parsed.data)
      res.status(201).json(student)
    } catch (error: any) {
      res.status(409).json({ error: error.message })
    }
  }
)

// POST /api/students/:id/enroll — matricula um aluno em um curso
router.post(
  '/:id/enroll',
  authMiddleware,
  requireRole(Role.ADMIN),
  async (req: Request, res: Response) => {
    const parsed = enrollStudentSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten() })
      return
    }

    try {
      const enrollment = await StudentsService.enrollStudent(req.params.id, parsed.data)
      res.status(201).json(enrollment)
    } catch (error: any) {
      res.status(409).json({ error: error.message })
    }
  }
)

export default router
