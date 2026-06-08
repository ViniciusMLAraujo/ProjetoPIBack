import { prisma } from '../../config/prisma'

interface CreateRoomDTO {
  name: string
  capacity: number
}

interface UpdateRoomDTO {
  name?: string
  capacity?: number
}

export async function getAllRooms() {
  return prisma.room.findMany({
    include: { schedules: true },
    orderBy: { name: 'asc' },
  })
}

export async function getRoomById(id: string) {
  const room = await prisma.room.findUnique({
    where: { id },
    include: { schedules: true },
  })

  if (!room) throw new Error('Sala não encontrada')
  return room
}

export async function createRoom(data: CreateRoomDTO) {
  return prisma.room.create({ data })
}

export async function updateRoom(id: string, data: UpdateRoomDTO) {
  await getRoomById(id)

  return prisma.room.update({
    where: { id },
    data,
  })
}

export async function deleteRoom(id: string) {
  await getRoomById(id)

  return prisma.room.delete({ where: { id } })
}
