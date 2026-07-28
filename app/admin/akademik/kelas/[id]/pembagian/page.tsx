'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Siswa {
  id: string
  nama: string
  nis: string
  halaqahId: string | null
}

interface Guru {
  id: string
  user: { name: string }
}

interface Halaqah {
  id: string
  guruId: string
  guru: Guru
  nama: string
}

interface Kelas {
  id: string
  nama: string
  tingkat: number
  halaqahs: Halaqah[]
  siswa: Siswa[]
}

export default function PembagianHalaqahPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  
  const [kelas, setKelas] = useState<Kelas | null>(null)
  const [loading, setLoading] = useState(true)
  const [assignments, setAssignments] = useState<Record<string, string | null>>({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetch(`/api/akademik/kelas/${id}/pembagian`)
      .then(res => res.json())
      .then((data: Kelas) => {
        setKelas(data)
        const init: Record<string, string | null> = {}
        data.siswa?.forEach(s => { init[s.id] = s.halaqahId || null })
        setAssignments(init)
      })
      .finally(() => setLoading(false))
  }, [id])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/akademik/kelas/${id}/pembagian`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments })
      })
      if (!res.ok) throw new Error('Gagal menyimpan pembagian halaqah')
      
      setToast('Berhasil menyimpan perubahan')
      setTimeout(() => router.push('/admin/akademik'), 1500)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '32px' }}>Loading...</div>
  }

  if (!kelas) {
    return <div style={{ padding: '32px' }}>Kelas tidak ditemukan</div>
  }

  return (
    <div style={{ padding: '32px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/admin/akademik" style={{ color: '#64748b', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          Kembali ke Akademik
        </Link>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1e293b', marginTop: '12px', marginBottom: '4px' }}>
          Pembagian Guru Halaqah
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>
          Tentukan Guru Halaqah Tahfizh untuk setiap siswa di Kelas {kelas.nama}
        </p>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ fontWeight: 600, color: '#334155' }}>Daftar Siswa ({kelas.siswa.length})</div>
          {kelas.halaqahs.length === 0 && (
            <div style={{ fontSize: '12px', color: '#dc2626', background: '#fee2e2', padding: '6px 12px', borderRadius: '8px' }}>
              ⚠️ Kelas ini belum memiliki Guru Tahfizh yang ditugaskan.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {kelas.siswa.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '15px' }}>{s.nama}</div>
                <div style={{ color: '#64748b', fontSize: '13px' }}>NIS: {s.nis}</div>
              </div>
              <div>
                <select 
                  className="input" 
                  style={{ width: '220px', padding: '8px 12px', fontSize: '14px' }}
                  value={assignments[s.id] || ''}
                  onChange={(e) => setAssignments({ ...assignments, [s.id]: e.target.value || null })}
                >
                  <option value="">-- Pilih Guru Halaqah --</option>
                  {kelas.halaqahs.map(h => (
                    <option key={h.id} value={h.id}>{h.guru.user.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
          {kelas.siswa.length === 0 && (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '30px 0' }}>Belum ada siswa di kelas ini</div>
          )}
        </div>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || kelas.siswa.length === 0}>
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#10b981', color: 'white', padding: '12px 20px', borderRadius: '8px', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)', fontWeight: 600, animation: 'fadeIn 0.3s ease-out', zIndex: 1000 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
