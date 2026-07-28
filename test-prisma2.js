require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  try {
    const siswa = await prisma.siswa.findMany({
      take: 2,
      include: {
        ortu: { include: { user: { select: { name: true, email: true, username: true } } } },
        kelasRef: true,
        setorans: {
          select: { jenis: true, nilaiAkhir: true, predikat: true, tanggal: true },
          orderBy: { tanggal: 'desc' },
          take: 5,
        },
      },
      orderBy: [{ kelas: 'asc' }, { nama: 'asc' }],
    });
    console.log("SUCCESS:", siswa.length);
  } catch (e) {
    console.error("ERROR:");
    console.error(e);
  }
}
run().then(() => prisma.$disconnect());
