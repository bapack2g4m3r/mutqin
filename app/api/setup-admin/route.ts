import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const hashedPassword = await bcrypt.hash('Mutqin#2026', 10);
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    
    if (adminUser) {
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { 
          email: 'admin',
          username: 'admin',
          password: hashedPassword 
        }
      });
      return NextResponse.json({ success: true, message: 'Admin account updated successfully to username: admin' })
    }
    return NextResponse.json({ success: false, message: 'Admin user not found in the database.' })
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Error updating admin account.', error: String(error) })
  }
}
