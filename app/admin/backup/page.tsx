'use client'
import { useState } from 'react'
import * as XLSX from 'xlsx'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

export default function BackupPage() {
  const [downloading, setDownloading] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 4000)
  }

  const handleExport = async (format: 'xlsx' | 'csv') => {
    if (downloading) return
    setDownloading(true)
    showToast('⏳ Sedang menyiapkan data dari database, mohon tunggu...')

    try {
      const res = await fetch('/api/backup/export')
      if (!res.ok) {
        throw new Error('Gagal menarik data dari server')
      }
      
      const data = await res.json()
      
      const dateStr = new Date().toISOString().split('T')[0]
      const fileNameXlsx = `Backup_Mutqin_${dateStr}.xlsx`
      const fileNameZip = `Backup_Mutqin_CSV_${dateStr}.zip`

      // Convert JSON arrays to sheets
      const sheetSiswa = XLSX.utils.json_to_sheet(data.siswa || [])
      const sheetGuru = XLSX.utils.json_to_sheet(data.guru || [])
      const sheetAkademik = XLSX.utils.json_to_sheet(data.akademik || [])
      const sheetSetoran = XLSX.utils.json_to_sheet(data.setoran || [])

      if (format === 'xlsx') {
        // Generate Multi-sheet Excel
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, sheetSiswa, 'Data Siswa')
        XLSX.utils.book_append_sheet(wb, sheetGuru, 'Data Guru')
        XLSX.utils.book_append_sheet(wb, sheetAkademik, 'Data Akademik')
        XLSX.utils.book_append_sheet(wb, sheetSetoran, 'Data Setoran')
        
        XLSX.writeFile(wb, fileNameXlsx)
        showToast('✓ Berhasil mendownload backup Excel (.xlsx)')
      } 
      else if (format === 'csv') {
        // Generate Zip containing multiple CSVs
        const zip = new JSZip()
        zip.file('Data_Siswa.csv', XLSX.utils.sheet_to_csv(sheetSiswa))
        zip.file('Data_Guru.csv', XLSX.utils.sheet_to_csv(sheetGuru))
        zip.file('Data_Akademik.csv', XLSX.utils.sheet_to_csv(sheetAkademik))
        zip.file('Data_Setoran.csv', XLSX.utils.sheet_to_csv(sheetSetoran))
        
        const blob = await zip.generateAsync({ type: 'blob' })
        saveAs(blob, fileNameZip)
        showToast('✓ Berhasil mendownload backup CSV (.zip)')
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat mendownload backup')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div style={{ padding: '32px', maxWidth: '900px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>Backup & Restore</h1>
        <p style={{ color: '#64748b', fontSize: '15px' }}>Kelola pencadangan data sistem secara menyeluruh</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        
        {/* EXPORT SECTION */}
        <div style={{
          background: 'white', borderRadius: '24px', padding: '32px',
          boxShadow: '0 4px 20px rgba(30, 58, 138, 0.05)', border: '1px solid #f1f5f9'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '24px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', marginBottom: '6px' }}>Export Keseluruhan Database</h2>
              <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.5 }}>
                Unduh seluruh data Siswa, Guru, Struktur Akademik, dan <b>Riwayat Setoran (Tahfidz/Tahsin)</b>. Anda dapat mengunduh dalam bentuk file Excel Tunggal (.xlsx) atau file Zip berisi sekumpulan CSV (.csv).
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', paddingLeft: '76px' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => handleExport('xlsx')}
              disabled={downloading}
              style={{ padding: '12px 24px', fontSize: '14px' }}
            >
              {downloading ? 'Memproses...' : 'Download Backup (.xlsx)'}
            </button>
            <button 
              className="btn btn-outline" 
              onClick={() => handleExport('csv')}
              disabled={downloading}
              style={{ padding: '12px 24px', fontSize: '14px' }}
            >
              {downloading ? 'Memproses...' : 'Download Backup (.csv.zip)'}
            </button>
          </div>
        </div>

        {/* RESTORE SECTION (Coming Soon placeholder) */}
        <div style={{
          background: 'white', borderRadius: '24px', padding: '32px',
          boxShadow: '0 4px 20px rgba(30, 58, 138, 0.05)', border: '1px solid #f1f5f9'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '24px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', marginBottom: '6px' }}>Restore Keseluruhan Database</h2>
              <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.5 }}>
                Kembalikan data dari file backup yang pernah Anda unduh. Sistem akan memulihkan data tanpa menghapus data baru yang diinput setelah tanggal backup (Upsert / Update & Insert).
              </p>
            </div>
          </div>

          <div style={{ paddingLeft: '76px' }}>
            <div style={{ 
              background: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: '16px', 
              padding: '24px', textAlign: 'center' 
            }}>
              <p style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 600 }}>
                Fitur Restore Keseluruhan (Full Upsert) sedang dalam tahap pengembangan.
              </p>
              <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
                Untuk saat ini, Anda bisa melakukan restore per-modul melalui fitur Bulk Import di masing-masing halaman.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Toast Notifikasi */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
          background: '#1e3a8a', color: 'white', padding: '14px 28px', borderRadius: '50px',
          fontSize: '14px', fontWeight: 600, boxShadow: '0 12px 32px rgba(15, 23, 42, 0.4)',
          zIndex: 9999, animation: 'slideUp 0.3s ease'
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
