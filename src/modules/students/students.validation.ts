import { z } from 'zod'

export const createStudentSchema = z.object({
  name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
  enrollment: z.string().min(1, 'Matrícula é obrigatória'),
})

export type CreateStudentInput = z.infer<typeof createStudentSchema>

export const enrollStudentSchema = z.object({
  courseId: z.string().uuid('courseId deve ser um UUID válido'),
})

export type EnrollStudentInput = z.infer<typeof enrollStudentSchema>
