import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Query Supabase to trigger activity, prevent auto-pause, and count total QR codes
    const { count, error } = await supabase
      .from('qr_codes')
      .select('id', { count: 'exact' })
      .limit(1)

    if (error) {
      console.error('Supabase health check error:', error)
      return NextResponse.json(
        {
          status: 'error',
          database: 'disconnected',
          driver: 'pgsql',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
          },
        }
      )
    }

    return NextResponse.json(
      {
        status: 'ok',
        database: 'connected',
        driver: 'pgsql',
        total_qr: count ?? 0,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    )
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown server error'
    console.error('Health route error:', err)
    return NextResponse.json(
      {
        status: 'error',
        database: 'disconnected',
        driver: 'pgsql',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    )
  }
}

