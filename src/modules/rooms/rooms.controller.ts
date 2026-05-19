// src/modules/rooms/rooms.controller.ts
import { Request, Response } from 'express'
import * as RoomsService from './rooms.service'

export async function index(req: Request, res: Response) {
  try {
    const rooms = await RoomsService.getAllRooms()
    res.json(rooms)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export async function show(req: Request, res: Response) {
  try {
    const id = req.params.id as string
    const room = await RoomsService.getRoomById(id)
    res.json(room)
  } catch (err: any) {
    const status = err.message === 'Sala não encontrada' ? 404 : 500
    res.status(status).json({ error: err.message })
  }
}

export async function create(req: Request, res: Response) {
  try {
    const { name, capacity } = req.body
    const room = await RoomsService.createRoom({ name, capacity })
    res.status(201).json(room)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function update(req: Request, res: Response) {
  try {
    const id = req.params.id as string
    const room = await RoomsService.updateRoom(id, req.body)
    res.json(room)
  } catch (err: any) {
    const status = err.message === 'Sala não encontrada' ? 404 : 400
    res.status(status).json({ error: err.message })
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const id = req.params.id as string
    await RoomsService.deleteRoom(id)
    res.status(204).send()
  } catch (err: any) {
    const status = err.message === 'Sala não encontrada' ? 404 : 400
    res.status(status).json({ error: err.message })
  }
}