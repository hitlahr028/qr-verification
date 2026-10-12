import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const startTime = Date.now()

    // Query Supabase to trigger activity and prevent auto-pause
    const { error } = await supabase
      .from('qr_codes')
      .select('id')
      .limit(1)

    const responseTimeMs = Date.now() - startTime

    if (error) {
      console.error('Supabase health check error:', error)
      return NextResponse.json(
        {
          status: 'error',
          message: 'Supabase ping failed. Please ensure the project is active and not paused in Supabase Dashboard.',
          error: error.message,
          responseTimeMs,
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
        message: 'Supabase keep-alive ping successful',
        responseTimeMs,
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
        message: errorMessage,
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
