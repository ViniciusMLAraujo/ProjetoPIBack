import { z } from 'zod'

export const createCourseSchema = z.object({
  name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  code: z.string().min(1, 'Código é obrigatório'),
})

export type CreateCourseInput = z.infer<typeof createCourseSchema>
