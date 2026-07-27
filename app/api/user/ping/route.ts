import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await prisma.user.update({
      where: { id: (session.user as any).id },
      data: { lastActiveAt: new Date() }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update ping' }, { status: 500 })
  }
}
