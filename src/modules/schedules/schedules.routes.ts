import { Router } from 'express'
import { authMiddleware } from '../../shared/middlewares/auth.middleware'
import * as SchedulesController from './schedules.controller'

const router = Router()

router.use(authMiddleware)

router.get('/', SchedulesController.index)
router.get('/:id', SchedulesController.show)
router.post('/', SchedulesController.create)
router.put('/:id', SchedulesController.update)
router.delete('/:id', SchedulesController.remove)

export default router
