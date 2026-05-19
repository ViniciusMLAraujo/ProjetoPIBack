// src/modules/rooms/rooms.routes.ts
import { Router } from 'express'
import { authMiddleware } from '../../shared/middlewares/auth.middleware'
import * as RoomsController from './rooms.controller'

const router = Router()

// Todas as rotas de sala exigem autenticação
router.use(authMiddleware)

router.get('/', RoomsController.index)
router.get('/:id', RoomsController.show)
router.post('/', RoomsController.create)
router.put('/:id', RoomsController.update)
router.delete('/:id', RoomsController.remove)

export default router