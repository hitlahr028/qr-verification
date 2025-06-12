'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface QRCode {
  id: string
  title: string
  client_name: string
  created_at: string
  is_active: boolean
  verification_count: number
  verifications: { count: number }[] // Changed from any[] to specific type
}

interface Verification {
  id: string
  qr_id: string
  scanned_at: string
  ip_address: string
  user_agent: string
  status: string
  qr_codes: {
    title: string
    client_name: string
  }
}

interface Stats {
  totalQRCodes: number
  totalVerifications: number
  todayVerifications: number
  activeQRCodes: number
}

export default function Dashboard() {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([])
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [stats, setStats] = useState<Stats>({
    totalQRCodes: 0,
    totalVerifications: 0,
    todayVerifications: 0,
    activeQRCodes: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'qrcodes' | 'verifications'>('qrcodes')

  const loadQRCodes = useCallback(async () => {
    const { data, error } = await supabase
      .from('qr_codes')
      .select(`
        id,
        title,
        client_name,
        created_at,
        is_active,
        verifications(count)
      `)
      .order('created_at', { ascending: false })

    if (!error && data) {
      const qrCodesWithCount = data.map(qr => ({
        ...qr,
        verification_count: qr.verifications.length
      }))
      setQrCodes(qrCodesWithCount)
    }
  }, [])

  const loadVerifications = useCallback(async () => {
  const { data, error } = await supabase
    .from('verifications')
    .select(`
      id,
      qr_id,
      scanned_at,
      ip_address,
      user_agent,
      status,
      qr_codes (
        title,
        client_name
      )
    `)
    .order('scanned_at', { ascending: false })
    .limit(50)

  if (!error && data) {
    // Pastikan qr_codes adalah object, bukan array
    const mapped = data.map((v: {
      id: string;
      qr_id: string;
      scanned_at: string;
      ip_address: string;
      user_agent: string;
      status: string;
      qr_codes: { title: string; client_name: string } | { title: string; client_name: string }[];
    }) => ({
      ...v,
      qr_codes: Array.isArray(v.qr_codes) ? v.qr_codes[0] : v.qr_codes
    }))
    setVerifications(mapped)
  }
}, [])

  const loadStats = useCallback(async () => {
    // Total QR Codes
    const { count: totalQR } = await supabase
      .from('qr_codes')
      .select('*', { count: 'exact', head: true })

    // Active QR Codes
    const { count: activeQR } = await supabase
      .from('qr_codes')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Total Verifications
    const { count: totalVerif } = await supabase
      .from('verifications')
      .select('*', { count: 'exact', head: true })

    // Today's Verifications
    const today = new Date().toISOString().split('T')[0]
    const { count: todayVerif } = await supabase
      .from('verifications')
      .select('*', { count: 'exact', head: true })
      .gte('scanned_at', `${today}T00:00:00`)
      .lt('scanned_at', `${today}T23:59:59`)

    setStats({
      totalQRCodes: totalQR || 0,
      totalVerifications: totalVerif || 0,
      todayVerifications: todayVerif || 0,
      activeQRCodes: activeQR || 0
    })
  }, [])

  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadQRCodes(),
        loadVerifications(),
        loadStats()
      ])
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }, [loadQRCodes, loadVerifications, loadStats])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const toggleQRStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('qr_codes')
      .update({ is_active: !currentStatus })
      .eq('id', id)

    if (!error) {
      loadQRCodes()
      loadStats()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const exportData = async () => {
    const { data } = await supabase
      .from('verifications')
      .select(`
        *,
        qr_codes (
          title,
          client_name,
          data
        )
      `)
      .order('scanned_at', { ascending: false })

    if (data) {
      const csv = [
        ['Date', 'QR Title', 'Client Name', 'IP Address', 'Status'],
        ...data.map(v => [
          formatDate(v.scanned_at),
          v.qr_codes?.title || '',
          v.qr_codes?.client_name || '',
          v.ip_address,
          v.status
        ])
      ].map(row => row.join(',')).join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `verifications-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Kelola QR Code dan pantau verifikasi</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={exportData}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-medium"
            >
              Export Data
            </button>
            <Link
              href="/"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
            >
              Buat QR Baru
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total QR Codes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalQRCodes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">QR Aktif</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeQRCodes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Verifikasi</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalVerifications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hari Ini</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayVerifications}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('qrcodes')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'qrcodes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                QR Codes ({qrCodes.length})
              </button>
              <button
                onClick={() => setActiveTab('verifications')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'verifications'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Riwayat Verifikasi ({verifications.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'qrcodes' ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dibuat
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Verifikasi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {qrCodes.map((qr) => (
                      <tr key={qr.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{qr.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{qr.client_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{formatDate(qr.created_at)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {qr.verification_count} kali
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            qr.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {qr.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <Link
                            href={`/verify/${qr.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Lihat
                          </Link>
                          <button
                            onClick={() => toggleQRStatus(qr.id, qr.is_active)}
                            className={`${
                              qr.is_active 
                                ? 'text-red-600 hover:text-red-900' 
                                : 'text-green-600 hover:text-green-900'
                            }`}
                          >
                            {qr.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Waktu Scan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        QR Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IP Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {verifications.map((verification) => (
                      <tr key={verification.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(verification.scanned_at)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{verification.qr_codes?.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{verification.qr_codes?.client_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{verification.ip_address}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {verification.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}