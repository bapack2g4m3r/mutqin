import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

async function ensureTableExists() {
  try {
    await prisma.$queryRaw`SELECT 1 FROM "SystemSetting" LIMIT 1`
  } catch (e) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SystemSetting" (
        "id" TEXT NOT NULL,
        "key" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
      );
    `)
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "SystemSetting_key_key" ON "SystemSetting"("key");
    `)
  }
}

export async function GET() {
  try {
    await ensureTableExists()
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ['PTS_ENABLED', 'PTS_DATE_LABEL', 'PTS_WEIGHT_HARIAN', 'PTS_WEIGHT_PTS', 'PTS_TYPE', 'PTS_TITLE']
        }
      }
    })

    const map = new Map(settings.map(s => [s.key, s.value]))

    const enabled = map.has('PTS_ENABLED') ? map.get('PTS_ENABLED') === 'true' : true
    const dateLabel = map.get('PTS_DATE_LABEL') || '21 - 23 September 2026'
    const bobotHarian = map.has('PTS_WEIGHT_HARIAN') ? parseInt(map.get('PTS_WEIGHT_HARIAN')!) : 40
    const bobotPts = map.has('PTS_WEIGHT_PTS') ? parseInt(map.get('PTS_WEIGHT_PTS')!) : 60
    const tipeUjian = map.get('PTS_TYPE') || 'PTS'
    const judulUjian = map.get('PTS_TITLE') || 'Penilaian Tengah Semester (PTS)'

    return NextResponse.json({
      enabled,
      dateLabel,
      bobotHarian,
      bobotPts,
      tipeUjian,
      judulUjian
    })
  } catch (error) {
    return NextResponse.json({
      enabled: true,
      dateLabel: '21 - 23 September 2026',
      bobotHarian: 40,
      bobotPts: 60,
      tipeUjian: 'PTS',
      judulUjian: 'Penilaian Tengah Semester (PTS)'
    })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { enabled, dateLabel, bobotHarian, bobotPts, tipeUjian, judulUjian } = body

    await ensureTableExists()

    const upserts = [
      prisma.systemSetting.upsert({
        where: { key: 'PTS_ENABLED' },
        update: { value: String(enabled !== false) },
        create: { key: 'PTS_ENABLED', value: String(enabled !== false) }
      }),
      prisma.systemSetting.upsert({
        where: { key: 'PTS_DATE_LABEL' },
        update: { value: String(dateLabel || '21 - 23 September 2026') },
        create: { key: 'PTS_DATE_LABEL', value: String(dateLabel || '21 - 23 September 2026') }
      }),
      prisma.systemSetting.upsert({
        where: { key: 'PTS_WEIGHT_HARIAN' },
        update: { value: String(bobotHarian ?? 40) },
        create: { key: 'PTS_WEIGHT_HARIAN', value: String(bobotHarian ?? 40) }
      }),
      prisma.systemSetting.upsert({
        where: { key: 'PTS_WEIGHT_PTS' },
        update: { value: String(bobotPts ?? 60) },
        create: { key: 'PTS_WEIGHT_PTS', value: String(bobotPts ?? 60) }
      }),
      prisma.systemSetting.upsert({
        where: { key: 'PTS_TYPE' },
        update: { value: String(tipeUjian || 'PTS') },
        create: { key: 'PTS_TYPE', value: String(tipeUjian || 'PTS') }
      }),
      prisma.systemSetting.upsert({
        where: { key: 'PTS_TITLE' },
        update: { value: String(judulUjian || 'Penilaian Tengah Semester (PTS)') },
        create: { key: 'PTS_TITLE', value: String(judulUjian || 'Penilaian Tengah Semester (PTS)') }
      })
    ]

    await Promise.all(upserts)

    return NextResponse.json({
      success: true,
      enabled: enabled !== false,
      dateLabel: dateLabel || '21 - 23 September 2026',
      bobotHarian: bobotHarian ?? 40,
      bobotPts: bobotPts ?? 60,
      tipeUjian: tipeUjian || 'PTS',
      judulUjian: judulUjian || 'Penilaian Tengah Semester (PTS)'
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}
