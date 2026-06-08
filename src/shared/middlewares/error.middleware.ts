import { Request, Response, NextFunction, ErrorRequestHandler } from 'express'

export const errorMiddleware: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(`[ERROR] ${err.message}`)

  if (err.message.includes('não encontrado')) {
    res.status(404).json({ error: err.message })
    return
  }

  if (err.message.includes('já cadastrado') || err.message.includes('já existe') || err.message.includes('já cadastrado')) {
    res.status(409).json({ error: err.message })
    return
  }

  if (err.message.includes('não matriculado') || err.message.includes('sem permissão')) {
    res.status(403).json({ error: err.message })
    return
  }

  if (err.message.includes('inválido') || err.message.includes('expirado') || err.message.includes('já utilizado')) {
    res.status(400).json({ error: err.message })
    return
  }

  res.status(500).json({ error: 'Erro interno do servidor' })
}
