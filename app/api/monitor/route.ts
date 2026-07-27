import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Cari user aktif (lastActiveAt > 5 menit lalu)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
  
  const activeUsers = await prisma.user.findMany({
    where: {
      lastActiveAt: {
        gte: fiveMinutesAgo
      }
    },
    select: {
      id: true,
      name: true,
      role: true,
      lastActiveAt: true
    },
    orderBy: {
      lastActiveAt: 'desc'
    }
  })

  // Cari log aktivitas (100 terbaru)
  const activityLogs = await prisma.activityLog.findMany({
    take: 100,
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      user: {
        select: {
          name: true,
          role: true
        }
      }
    }
  })

  return NextResponse.json({
    activeUsers,
    activityLogs
  })
}
