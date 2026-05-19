import request from 'supertest'
import app from '../server'
import * as authService from '../modules/auth/auth.service'
import { Role } from '@prisma/client'

jest.mock('../config/env', () => ({
  env: {
    JWT_SECRET: 'test-secret',
    JWT_EXPIRES_IN: '8h',
    DATABASE_URL: 'postgresql://test',
    PORT: 3001,
    MQTT_BROKER_URL: 'mqtt://localhost:1883',
  },
}))

jest.mock('../modules/auth/auth.service')

const mockLogin = authService.login as jest.MockedFunction<typeof authService.login>

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks())

  it('deve retornar 400 para body inválido', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nao-é-email' })
    expect(res.status).toBe(400)
  })

  it('deve retornar 404 para usuário inexistente', async () => {
    mockLogin.mockRejectedValue(new Error('Usuário não encontrado'))

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'x@x.com', password: '123456' })

    expect(res.status).toBe(404)
  })

  it('deve retornar token em login válido', async () => {
    mockLogin.mockResolvedValue({ token: 'fake-jwt-token', role: Role.STUDENT })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'aluno@senac.br', password: 'senha123' })

    expect(res.status).toBe(200)
    expect(res.body.token).toBe('fake-jwt-token')
  })
})

describe('GET /api/auth/me', () => {
  it('deve retornar 401 sem token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('deve retornar dados do usuário com token válido', async () => {
    const jwt = require('jsonwebtoken')
    const token = jwt.sign({ userId: 'u1', role: Role.ADMIN }, 'test-secret')

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.user.userId).toBe('u1')
  })
})

describe('GET /health', () => {
  it('deve retornar status ok', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })
})
