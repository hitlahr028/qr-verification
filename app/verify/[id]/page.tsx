'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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

interface QRCode {
  id: string
  title: string
  client_name: string
  data: QRData
  created_at: string
  is_active: boolean
}

export default function VerifyPage() {
  const params = useParams()
  const id = params.id as string
  
  const [qrData, setQrData] = useState<QRCode | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      verifyQRCode(id)
    }
  }, [id])

  const verifyQRCode = async (qrId: string) => {
    try {
      // 1. Ambil data QR dari database
      const { data: qrCode, error: qrError } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('id', qrId)
        .eq('is_active', true)
        .single()

      if (qrError || !qrCode) {
        throw new Error('QR Code tidak valid atau sudah tidak aktif')
      }

      setQrData(qrCode)

      // 2. Record verifikasi ke database
      const { error: verifyError } = await supabase
        .from('verifications')
        .insert([
          {
            qr_id: qrId,
            ip_address: await getClientIP(),
            user_agent: navigator.userAgent,
            status: 'verified'
          }
        ])

      if (verifyError) {
        console.error('Error recording verification:', verifyError)
      }

    } catch (error: any) {
      console.error('Verification error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch {
      return 'unknown'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memverifikasi QR Code...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-red-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-800 mb-2">Invalid QR Code</h1>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!qrData) return null

  const data = qrData.data

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-teal-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          
          {/* Header dengan Checkmark */}
          <div className="bg-teal-500 rounded-t-lg p-6 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              VALID VERIFICATION CODE
            </h1>
          </div>

          {/* Company Info */}
          <div className="bg-white px-6 py-4 border-b">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-600 rounded mx-auto mb-2 flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <h2 className="text-lg font-bold text-gray-800">{qrData.client_name}</h2>
              <p className="text-sm text-gray-600 mt-2">
                The following details are confirmed by:
              </p>
              <p className="text-sm font-medium text-blue-600">
                SYSTEMCENTER.ID/TRIYASA
              </p>
            </div>
          </div>

          {/* Verification Details */}
          <div className="bg-white">
            <div className="grid grid-cols-1 divide-y divide-gray-200">
              
              <div className="px-6 py-3 flex justify-between">
                <span className="text-teal-600 font-medium">CLIENT NAME</span>
                <span className="text-gray-800 font-medium">{qrData.client_name}</span>
              </div>

              {data.vessel && (
                <div className="px-6 py-3 flex justify-between">
                  <span className="text-teal-600 font-medium">TB/BG/VESSEL</span>
                  <span className="text-gray-800">{data.vessel}</span>
                </div>
              )}

              {data.quantity && (
                <div className="px-6 py-3 flex justify-between">
                  <span className="text-teal-600 font-medium">QUANTITY</span>
                  <span className="text-gray-800">{data.quantity}</span>
                </div>
              )}

              {data.portLoading && (
                <div className="px-6 py-3 flex justify-between">
                  <span className="text-teal-600 font-medium">PORT OF LOADING</span>
                  <span className="text-gray-800">{data.portLoading}</span>
                </div>
              )}

              {data.portDischarging && (
                <div className="px-6 py-3 flex justify-between">
                  <span className="text-teal-600 font-medium">PORT OF DISCHARGING</span>
                  <span className="text-gray-800">{data.portDischarging}</span>
                </div>
              )}

              {data.wiNumber && (
                <div className="px-6 py-3 flex justify-between">
                  <span className="text-teal-600 font-medium">WI NUMBER</span>
                  <span className="text-gray-800">{data.wiNumber}</span>
                </div>
              )}

              {data.certificateNumber && (
                <div className="px-6 py-3 flex justify-between">
                  <span className="text-teal-600 font-medium">CERTIFICATE NUMBER</span>
                  <span className="text-gray-800">{data.certificateNumber}</span>
                </div>
              )}

              {data.commodity && (
                <div className="px-6 py-3 flex justify-between">
                  <span className="text-teal-600 font-medium">COMMODITY BRANCH</span>
                  <span className="text-gray-800">{data.commodity}</span>
                </div>
              )}

              {/* Parameter Results Section */}
              {(data.ashContent || data.totalSulphur || data.calorificValue) && (
                <>
                  <div className="px-6 py-3 bg-gray-50">
                    <span className="text-gray-800 font-bold">PARAMETER RESULT</span>
                  </div>

                  {data.ashContent && (
                    <div className="px-6 py-3 flex justify-between">
                      <span className="text-teal-600 font-medium">- ASH CONTENT/AC (adb)</span>
                      <span className="text-gray-800">{data.ashContent}</span>
                    </div>
                  )}

                  {data.totalSulphur && (
                    <div className="px-6 py-3 flex justify-between">
                      <span className="text-teal-600 font-medium">- TOTAL SULPHUR/TS (adb)</span>
                      <span className="text-gray-800">{data.totalSulphur}</span>
                    </div>
                  )}

                  {data.calorificValue && (
                    <div className="px-6 py-3 flex justify-between">
                      <span className="text-teal-600 font-medium">- CALORIFIC VALUE (arb)</span>
                      <span className="text-gray-800">{data.calorificValue}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white rounded-b-lg px-6 py-4 text-center border-t">
            <p className="text-xs text-gray-500">
              © Copyright 2024 PT Mandiri Cipta Dwipangga
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Verified at: {new Date().toLocaleString('id-ID')}
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}