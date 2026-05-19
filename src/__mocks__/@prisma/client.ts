export enum Role {
  ADMIN = 'ADMIN',
  PROFESSOR = 'PROFESSOR',
  STUDENT = 'STUDENT',
}

export class PrismaClient {
  user = {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }
  student = {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }
  course = { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn() }
  room = { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn() }
  schedule = { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn() }
  enrollment = { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn() }
  qRToken = { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() }
  accessLog = { create: jest.fn(), findMany: jest.fn() }
}
