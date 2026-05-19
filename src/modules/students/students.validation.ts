import { z } from 'zod'

// Schema para criar aluno (cria User + Student juntos)
export const createStudentSchema = z.object({
  // Dados do User (login)
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),

  // Dados do Student (perfil)
  name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  enrollment: z.string().min(1, 'Matrícula é obrigatória'),
})

// Schema para matricular aluno em curso
export const enrollStudentSchema = z.object({
  courseId: z.string().uuid('ID do curso inválido'),
})

export type CreateStudentInput = z.infer<typeof createStudentSchema>
export type EnrollStudentInput = z.infer<typeof enrollStudentSchema>