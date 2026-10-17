import { NextResponse } from 'next/server';
import { db } from '../../../lib/db.ts';

export const dynamic = 'force-dynamic';

export async function GET() {
  const uptimeSeconds = Math.floor(process.uptime());
  const timestamp = new Date().toISOString();
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || 'local-dev';

  let dbStatus = 'disconnected';
  let dbLatencyMs: number | null = null;

  try {
    const startTime = Date.now();
    const isDbConfigured = db.isConnected();

    if (isDbConfigured) {
      dbStatus = 'connected';
      dbLatencyMs = Date.now() - startTime;
    } else {
      dbStatus = 'ready-static';
      dbLatencyMs = 0;
    }
  } catch (error) {
    dbStatus = 'error';
    return NextResponse.json(
      {
        status: 'error',
        timestamp,
        uptimeSeconds,
        commitSha,
        database: {
          status: dbStatus,
          error: error instanceof Error ? error.message : 'Unknown database error',
        },
      },
      { status: 503 }
    );
  }

  return NextResponse.json(
    {
      status: 'ok',
      service: 'Ascent Transport Management API',
      timestamp,
      uptimeSeconds,
      commitSha,
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
