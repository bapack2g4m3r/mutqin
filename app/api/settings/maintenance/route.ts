import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'MAINTENANCE_MODE' }
    })
    
    return NextResponse.json({
      maintenanceMode: setting?.value === 'true'
    })
  } catch (error) {
    return NextResponse.json({ maintenanceMode: false }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { maintenanceMode } = body

    const setting = await prisma.systemSetting.upsert({
      where: { key: 'MAINTENANCE_MODE' },
      update: { value: String(maintenanceMode) },
      create: { key: 'MAINTENANCE_MODE', value: String(maintenanceMode) }
    })

    return NextResponse.json({
      success: true,
      maintenanceMode: setting.value === 'true'
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
