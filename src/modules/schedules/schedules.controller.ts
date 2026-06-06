import { Request, Response } from 'express'
import * as SchedulesService from './schedules.service'

export async function index(req: Request, res: Response) {
  try {
    const schedules = await SchedulesService.getAllSchedules()
    res.json(schedules)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export async function show(req: Request, res: Response) {
  try {
    const schedule = await SchedulesService.getScheduleById(req.params.id)
    res.json(schedule)
  } catch (err: any) {
    const status = err.message === 'Horário não encontrado' ? 404 : 500
    res.status(status).json({ error: err.message })
  }
}

export async function create(req: Request, res: Response) {
  try {
    const { courseId, roomId, dayOfWeek, startTime, endTime } = req.body
    const schedule = await SchedulesService.createSchedule({ courseId, roomId, dayOfWeek, startTime, endTime })
    res.status(201).json(schedule)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function update(req: Request, res: Response) {
  try {
    const schedule = await SchedulesService.updateSchedule(req.params.id, req.body)
    res.json(schedule)
  } catch (err: any) {
    const status = err.message === 'Horário não encontrado' ? 404 : 400
    res.status(status).json({ error: err.message })
  }
}

export async function remove(req: Request, res: Response) {
  try {
    await SchedulesService.deleteSchedule(req.params.id)
    res.status(204).send()
  } catch (err: any) {
    const status = err.message === 'Horário não encontrado' ? 404 : 400
    res.status(status).json({ error: err.message })
  }
}
