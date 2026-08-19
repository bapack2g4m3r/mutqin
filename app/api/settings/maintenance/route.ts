import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

// Fungsi untuk memastikan tabel SystemSetting ada tanpa perlu prisma db push
async function ensureTableExists() {
  try {
    await prisma.$queryRaw`SELECT 1 FROM "SystemSetting" LIMIT 1`;
  } catch (e) {
    // Jika tabel tidak ada, buat tabel secara manual
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SystemSetting" (
        "id" TEXT NOT NULL,
        "key" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "SystemSetting_key_key" ON "SystemSetting"("key");
    `);
  }
}

export async function GET() {
  try {
    await ensureTableExists();
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

    await ensureTableExists();

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
