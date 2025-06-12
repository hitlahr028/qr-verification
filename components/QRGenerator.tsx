'use client'
import { useState } from 'react'
import QRCode from 'qrcode'
import { supabase } from '@/lib/supabase'
import toast, { Toaster } from 'react-hot-toast'
import Image from 'next/image'

interface QRData {
  title: string
  clientName: string
  vessel: string
  quantity: string
  portLoading: string
  portDischarging: string
  wiNumber: string
  certificateNumber: string
  commodity: string
  ashContent: string
  totalSulphur: string
  calorificValue: string
}

export default function QRGenerator() {

  const [formData, setFormData] = useState<QRData>({
    title: '',
    clientName: '',
    vessel: '',
    quantity: '',
    portLoading: '',
    portDischarging: '',
    wiNumber: '',
    certificateNumber: '',
    commodity: '',
    ashContent: '',
    totalSulphur: '',
    calorificValue: ''
  })
  
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [generatedId, setGeneratedId] = useState<string>('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const generateQRCode = async () => {
    if (!formData.title || !formData.clientName) {
      toast.error('Title dan Client Name wajib diisi!')
      return
    }

    setIsGenerating(true)
    
    try {
      // 1. Simpan data ke database dulu
      const { data: qrData, error: dbError } = await supabase
        .from('qr_codes')
        .insert([
          {
            title: formData.title,
            client_name: formData.clientName,
            data: formData
          }
        ])
        .select()
        .single()

      if (dbError) throw dbError

      const qrId = qrData.id
      setGeneratedId(qrId)

      // 2. Generate QR code dengan URL verifikasi
      const verificationUrl = `${window.location.origin}/verify/${qrId}`
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      // 3. Update database dengan QR code URL
      const { error: updateError } = await supabase
        .from('qr_codes')
        .update({ qr_code_url: qrCodeDataUrl })
        .eq('id', qrId)

      if (updateError) throw updateError

      setQrCodeUrl(qrCodeDataUrl)
      toast.success('QR Code berhasil dibuat!')
      
    } catch (error: unknown) {
      console.error('Error generating QR:', error)
      if (error instanceof Error) {
        toast.error('Gagal membuat QR Code: ' + error.message)
      } else {
        toast.error('Gagal membuat QR Code')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadQR = () => {
    if (!qrCodeUrl) return
    
    const link = document.createElement('a')
    link.download = `QR-${formData.title || 'code'}.png`
    link.href = qrCodeUrl
    link.click()
  }

  const resetForm = () => {
    setFormData({
      title: '',
      clientName: '',
      vessel: '',
      quantity: '',
      portLoading: '',
      portDischarging: '',
      wiNumber: '',
      certificateNumber: '',
      commodity: '',
      ashContent: '',
      totalSulphur: '',
      calorificValue: ''
    })
    setQrCodeUrl('')
    setGeneratedId('')
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Toaster position="top-right" />
      
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header dengan navigation */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            QR Code Generator
          </h1>
          <a
            href="/dashboard"
            className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 font-medium"
          >
            Dashboard
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Input */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Data Verifikasi
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Verification Certificate"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Name *
              </label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="PT. TRIYASA PIRSA UTAMA"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vessel/TB/BG
                </label>
                <input
                  type="text"
                  name="vessel"
                  value={formData.vessel}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="text"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Port of Loading
                </label>
                <input
                  type="text"
                  name="portLoading"
                  value={formData.portLoading}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Port of Discharging
                </label>
                <input
                  type="text"
                  name="portDischarging"
                  value={formData.portDischarging}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WI Number
                </label>
                <input
                  type="text"
                  name="wiNumber"
                  value={formData.wiNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certificate Number
                </label>
                <input
                  type="text"
                  name="certificateNumber"
                  value={formData.certificateNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commodity Branch
              </label>
              <input
                type="text"
                name="commodity"
                value={formData.commodity}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ash Content (adb)
                </label>
                <input
                  type="text"
                  name="ashContent"
                  value={formData.ashContent}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Sulphur (adb)
                </label>
                <input
                  type="text"
                  name="totalSulphur"
                  value={formData.totalSulphur}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calorific Value (arb)
                </label>
                <input
                  type="text"
                  name="calorificValue"
                  value={formData.calorificValue}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={generateQRCode}
                disabled={isGenerating}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isGenerating ? 'Generating...' : 'Generate QR Code'}
              </button>
              
              <button
                onClick={resetForm}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
              >
                Reset
              </button>
            </div>
          </div>

          {/* QR Code Preview */}
          <div className="flex flex-col items-center justify-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              QR Code Preview
            </h2>
            
            {qrCodeUrl ? (
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
                  <Image 
                    src={qrCodeUrl} 
                    alt="QR Code" 
                    width={256}
                    height={256}
                    className="mx-auto"
                  />
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    QR ID: <span className="font-mono">{generatedId}</span>
                  </p>
                  
                  <button
                    onClick={downloadQR}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 font-medium"
                  >
                    Download QR Code
                  </button>

                  {generatedId && (
                    <a
                      href={`/verify/${generatedId}`}
                      target="_blank"
                      className="w-full bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 font-medium inline-block text-center"
                    >
                      Test Verification Page
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-64 h-64 border-2 border-dashed border-gray-300 flex items-center justify-center rounded-lg">
                <p className="text-gray-500">QR Code akan muncul di sini</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}