import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { authMiddleware, requireRole } from '../shared/middlewares/auth.middleware'
import { Role } from '@prisma/client'


jest.mock('../config/env', () => ({
  env: {
    JWT_SECRET: 'test-secret',
    JWT_EXPIRES_IN: '8h',
  },
}))

const mockRes = () => {
  const res = {} as Response
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

const mockReq = (headers: Record<string, string> = {}) =>
  ({ headers } as unknown as Request)

const next: NextFunction = jest.fn()

describe('authMiddleware', () => {
  beforeEach(() => jest.clearAllMocks())

  it('deve rejeitar requisição sem token', () => {
    const req = mockReq()
    const res = mockRes()

    authMiddleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Token não fornecido' })
    expect(next).not.toHaveBeenCalled()
  })

  it('deve rejeitar token inválido', () => {
    const req = mockReq({ authorization: 'Bearer token-invalido' })
    const res = mockRes()

    authMiddleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido ou expirado' })
  })

  it('deve aceitar token válido e popular req.user', () => {
    const payload = { userId: 'user-123', role: Role.STUDENT }
    const token = jwt.sign(payload, 'test-secret')
    const req = mockReq({ authorization: `Bearer ${token}` })
    const res = mockRes()

    authMiddleware(req as Request, res, next)

    expect(next).toHaveBeenCalled()
    expect((req as any).user).toMatchObject(payload)
  })
})

describe('requireRole', () => {
  beforeEach(() => jest.clearAllMocks())

  it('deve bloquear usuário sem role adequada', () => {
    const req = { user: { userId: 'u1', role: Role.STUDENT } } as Request
    const res = mockRes()

    requireRole(Role.ADMIN)(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('deve permitir usuário com role correta', () => {
    const req = { user: { userId: 'u1', role: Role.ADMIN } } as Request
    const res = mockRes()

    requireRole(Role.ADMIN)(req, res, next)

    expect(next).toHaveBeenCalled()
  })

  it('deve aceitar múltiplas roles válidas', () => {
    const req = { user: { userId: 'u1', role: Role.PROFESSOR } } as Request
    const res = mockRes()

    requireRole(Role.ADMIN, Role.PROFESSOR)(req, res, next)

    expect(next).toHaveBeenCalled()
  })
})
