import { Request, Response, NextFunction } from 'express'

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(`[ERROR] ${err.message}`)

  if (err.message.includes('não encontrado') || err.message.includes('inválido')) {
    res.status(404).json({ error: err.message })
    return
  }

  if (err.message.includes('já existe') || err.message.includes('duplicado')) {
    res.status(409).json({ error: err.message })
    return
  }

  res.status(500).json({ error: 'Erro interno do servidor' })
}
