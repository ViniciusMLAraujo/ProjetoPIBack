import { login, createUser, hashPassword } from '../modules/auth/auth.service'
import { Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

jest.mock('../config/env', () => ({
  env: {
    JWT_SECRET: 'test-secret',
    JWT_EXPIRES_IN: '8h',
    DATABASE_URL: 'postgresql://test',
  },
}))


const mockFindUnique = jest.fn()
const mockCreate = jest.fn()

jest.mock('../config/prisma', () => ({
  prisma: {
    user: {
      findUnique: (...args: any[]) => mockFindUnique(...args),
      create: (...args: any[]) => mockCreate(...args),
    },
  },
}))

describe('auth.service - login', () => {
  beforeEach(() => jest.clearAllMocks())

  it('deve lançar erro se usuário não existe', async () => {
    mockFindUnique.mockResolvedValue(null)

    await expect(login('x@x.com', '123456')).rejects.toThrow('Usuário não encontrado')
  })

  it('deve lançar erro se senha incorreta', async () => {
    const hashed = await bcrypt.hash('senha-correta', 10)
    mockFindUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@a.com',
      password: hashed,
      role: Role.STUDENT,
    })

    await expect(login('a@a.com', 'senha-errada')).rejects.toThrow('Senha incorreta')
  })

  it('deve retornar token JWT em login válido', async () => {
    const hashed = await bcrypt.hash('senha123', 10)
    mockFindUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@a.com',
      password: hashed,
      role: Role.STUDENT,
    })

    const result = await login('a@a.com', 'senha123')

    expect(result.token).toBeDefined()
    expect(typeof result.token).toBe('string')
    expect(result.role).toBe(Role.STUDENT)
  })
})

describe('auth.service - createUser', () => {
  beforeEach(() => jest.clearAllMocks())

  it('deve lançar erro se e-mail já existe', async () => {
    mockFindUnique.mockResolvedValue({ id: 'u1' })

    await expect(createUser('dup@a.com', '123456')).rejects.toThrow('E-mail já cadastrado')
  })

  it('deve criar usuário com senha hasheada', async () => {
    mockFindUnique.mockResolvedValue(null)
    mockCreate.mockResolvedValue({
      id: 'u2',
      email: 'novo@a.com',
      role: Role.STUDENT,
      createdAt: new Date(),
    })

    const user = await createUser('novo@a.com', 'senha123')

    expect(user.email).toBe('novo@a.com')
    // garante que o create foi chamado com senha hasheada, não em texto puro
    const callArgs = mockCreate.mock.calls[0][0]
    expect(callArgs.data.password).not.toBe('senha123')
    expect(callArgs.data.password).toMatch(/^\$2[ab]\$/)
  })
})

describe('hashPassword', () => {
  it('deve retornar hash bcrypt válido', async () => {
    const hash = await hashPassword('minha-senha')
    expect(hash).toMatch(/^\$2[ab]\$/)
    const valid = await bcrypt.compare('minha-senha', hash)
    expect(valid).toBe(true)
  })
})