'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import QRCode from 'qrcode'
import Link from 'next/link'

interface FormData {
  title: string
  clientName: string
  vessel: string
  quantity: string
  portLoading: string
  portDischarging: string
  certificateNumber: string
  commodity: string
  branch: string
  ashContent: string
  totalSulphur: string
  calorificValue: string
}

const initialFormData: FormData = {
  title: '',
  clientName: '',
  vessel: '',
  quantity: '',
  portLoading: '',
  portDischarging: '',
  certificateNumber: '',
  commodity: '',
  branch: '',
  ashContent: '',
  totalSulphur: '',
  calorificValue: ''
}

export default function QRGenerator() {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [qrData, setQrData] = useState<{ id: string; qrCode: string } | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const generateQRCode = async () => {
    if (!formData.title || !formData.clientName) {
      alert('Title dan Client Name wajib diisi!')
      return
    }

    setIsGenerating(true)
    
    try {
      // Generate QR Code terlebih dahulu
      const tempId = crypto.randomUUID() // Generate temporary ID for QR URL
      const qrCodeUrl = `${window.location.origin}/verify/${tempId}`
      const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      // Simpan data ke Supabase dengan QR code image
      const { data, error } = await supabase
        .from('qr_codes')
        .insert([
          {
            id: tempId, // Use the same ID we used for QR generation
            title: formData.title,
            client_name: formData.clientName,
            data: formData,
            qr_code_image: qrCodeDataUrl, // Simpan base64 QR code
            is_active: true
          }
        ])
        .select()
        .single()

      if (error) throw error

      setQrData({
        id: data.id,
        qrCode: qrCodeDataUrl
      })

      // Reset form
      setFormData(initialFormData)
    } catch (error) {
      console.error('Error generating QR code:', error)
      alert('Error generating QR code')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadQR = () => {
    if (!qrData) return
    
    const link = document.createElement('a')
    link.download = `qr-${formData.title || 'verification'}.png`
    link.href = qrData.qrCode
    link.click()
  }

  const resetForm = () => {
    setQrData(null)
    setFormData(initialFormData)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            QR Code Verification Generator
          </h1>
          <p className="text-gray-600">
            Generate QR codes untuk verifikasi dokumen dan sertifikat
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Input */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Data Verifikasi
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="Verification Certificate"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Client Name *
              </label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="PT. TRIYASA PIRSA UTAMA"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Vessel/TB/BG
                </label>
                <input
                  type="text"
                  name="vessel"
                  value={formData.vessel}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Quantity
                </label>
                <input
                  type="text"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Port of Loading
                </label>
                <input
                  type="text"
                  name="portLoading"
                  value={formData.portLoading}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Port of Discharging
                </label>
                <input
                  type="text"
                  name="portDischarging"
                  value={formData.portDischarging}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
            </div>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Certificate Number
                </label>
                <input
                  type="text"
                  name="certificateNumber"
                  value={formData.certificateNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
            </div>
            <div>
              <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Commodity
                </label>
                <input
                  type="text"
                  name="commodity"
                  value={formData.commodity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Branch
                </label>
                <input
                  type="text"
                  name="branch"
                  value={formData.branch}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
            </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Ash Content (adb)
                </label>
                <input
                  type="text"
                  name="ashContent"
                  value={formData.ashContent}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Total Sulphur (adb)
                </label>
                <input
                  type="text"
                  name="totalSulphur"
                  value={formData.totalSulphur}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Calorific Value (arb)
                </label>
                <input
                  type="text"
                  name="calorificValue"
                  value={formData.calorificValue}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button
                onClick={generateQRCode}
                disabled={isGenerating}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {isGenerating ? 'Generating...' : 'Generate QR Code'}
              </button>
              <Link 
                href="/dashboard"
                className="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 font-medium"
              >
                Dashboard
              </Link>
            </div>
          </div>

          {/* QR Code Preview */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              QR Code Preview
            </h2>
            {qrData ? (
              <div className="text-center space-y-4">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <img 
                    src={qrData.qrCode} 
                    alt="QR Code" 
                    className="mx-auto border"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    QR Code berhasil dibuat!
                  </p>
                  <p className="text-xs text-gray-500 break-all">
                    URL: {window.location.origin}/verify/{qrData.id}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={downloadQR}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-medium"
                  >
                    Download QR
                  </button>
                  <button
                    onClick={resetForm}
                    className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 font-medium"
                  >
                    Reset
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="w-24 h-24 mx-auto mb-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p>QR Code akan muncul di sini setelah form diisi dan di-generate</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}