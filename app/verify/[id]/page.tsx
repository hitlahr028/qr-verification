"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

interface QRData {
  title: string;
  clientName: string;
  vessel: string;
  quantity: string;
  portLoading: string;
  portDischarging: string;
  certificateNumber: string;
  commodity: string;
  branch: string;
  ashContent: string;
  totalSulphur: string;
  calorificValue: string;
}

interface QRCode {
  id: string;
  title: string;
  client_name: string;
  data: QRData;
  created_at: string;
  is_active: boolean;
}

export default function VerifyPage() {
  const params = useParams();
  const id = params.id as string;

  const [qrData, setQrData] = useState<QRCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getClientIP = async () => {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch {
      return "unknown";
    }
  };

  const verifyQRCode = useCallback(async (qrId: string) => {
    try {
      // 1. Ambil data QR dari database
      const { data: qrCode, error: qrError } = await supabase
        .from("qr_codes")
        .select("*")
        .eq("id", qrId)
        .eq("is_active", true)
        .single();

      if (qrError || !qrCode) {
        throw new Error("QR Code tidak valid atau sudah tidak aktif");
      }

      setQrData(qrCode);

      // 2. Record verifikasi ke database
      const { error: verifyError } = await supabase
        .from("verifications")
        .insert([
          {
            qr_id: qrId,
            ip_address: await getClientIP(),
            user_agent: navigator.userAgent,
            status: "verified",
          },
        ]);

      if (verifyError) {
        console.error("Error recording verification:", verifyError);
      }
    } catch (error: unknown) {
      console.error("Verification error:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Terjadi kesalahan tidak dikenal");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      verifyQRCode(id);
    }
  }, [id, verifyQRCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memverifikasi QR Code...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-red-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-800 mb-2">
            Invalid QR Code
          </h1>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!qrData) return null;

  const data = qrData.data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-teal-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-600 rounded-t-lg p-6 text-center">
            <h1 className="text-xl font-bold text-white mb-2">
              VALID VERIFICATION CODE
            </h1>
          </div>

          {/* Company Info */}
          <div className="bg-white px-6 py-10 border-b">
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded mx-auto mb-2 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={48}
                  height={48}
                  priority
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-600 mb-2">
                  PT TRIYASA PIRSA UTAMA
                </h3>
              </div>
            </div>
          </div>

          {/* Verification Details */}
          <div className="bg-slate-50 rounded-b-lg px-4 sm:px-8 pb-20 pt-5">
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                  <span className="text-teal-600 font-medium text-sm sm:text-base">
                    CLIENT NAME
                  </span>
                  <span className="text-gray-800 font-medium text-sm sm:text-base break-words">
                    {qrData.client_name}
                  </span>
                </div>
              </div>

              {data.vessel && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                    <span className="text-teal-600 font-medium text-sm sm:text-base">
                      TB/BG/VESSEL
                    </span>
                    <span className="text-gray-800 text-sm sm:text-base break-words">
                      {data.vessel}
                    </span>
                  </div>
                </div>
              )}

              {data.quantity && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                    <span className="text-teal-600 font-medium text-sm sm:text-base">
                      QUANTITY
                    </span>
                    <span className="text-gray-800 text-sm sm:text-base break-words">
                      {data.quantity}
                    </span>
                  </div>
                </div>
              )}

              {data.portLoading && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex flex-col gap-2">
                    <span className="text-teal-600 font-medium text-sm sm:text-base">
                      PORT OF LOADING
                    </span>
                    <span className="text-gray-800 text-sm sm:text-base break-words">
                      {data.portLoading}
                    </span>
                  </div>
                </div>
              )}

              {data.portDischarging && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex flex-col gap-2">
                    <span className="text-teal-600 font-medium text-sm sm:text-base">
                      PORT OF DISCHARGING
                    </span>
                    <span className="text-gray-800 text-sm sm:text-base break-words">
                      {data.portDischarging}
                    </span>
                  </div>
                </div>
              )}

              {data.certificateNumber && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                    <span className="text-teal-600 font-medium text-sm sm:text-base">
                      CERTIFICATE NUMBER
                    </span>
                    <span className="text-gray-800 text-sm sm:text-base break-words">
                      {data.certificateNumber}
                    </span>
                  </div>
                </div>
              )}

              {data.commodity && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                    <span className="text-teal-600 font-medium text-sm sm:text-base">
                      COMMODITY
                    </span>
                    <span className="text-gray-800 text-sm sm:text-base break-words">
                      {data.commodity}
                    </span>
                  </div>
                </div>
              )}

              {data.branch && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                    <span className="text-teal-600 font-medium text-sm sm:text-base">
                      BRANCH
                    </span>
                    <span className="text-gray-800 text-sm sm:text-base break-words">
                      {data.branch}
                    </span>
                  </div>
                </div>
              )}

              {/* Parameter Results Section */}
              {(data.ashContent ||
                data.totalSulphur ||
                data.calorificValue) && (
                <>
                  <div className="bg-gray-200 p-4 rounded-lg">
                    <span className="text-gray-800 font-bold text-sm sm:text-base">
                      PARAMETER RESULT
                    </span>
                  </div>

                  {data.ashContent && (
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                        <span className="text-teal-600 font-medium text-sm sm:text-base">
                          - ASH CONTENT/AC (adb)
                        </span>
                        <span className="text-gray-800 text-sm sm:text-base">
                          {data.ashContent}
                        </span>
                      </div>
                    </div>
                  )}

                  {data.totalSulphur && (
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                        <span className="text-teal-600 font-medium text-sm sm:text-base">
                          - TOTAL SULPHUR/TS (adb)
                        </span>
                        <span className="text-gray-800 text-sm sm:text-base">
                          {data.totalSulphur}
                        </span>
                      </div>
                    </div>
                  )}

                  {data.calorificValue && (
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                        <span className="text-teal-600 font-medium text-sm sm:text-base">
                          - CALORIFIC VALUE (arb)
                        </span>
                        <span className="text-gray-800 text-sm sm:text-base">
                          {data.calorificValue}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
