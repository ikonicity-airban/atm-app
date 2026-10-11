/**
 * Contact & Inquiry API Route Handler
 * Validates request with shared Zod schema and records inquiry
 */

import { complaintSchema } from '@atm/shared';
import { successResponse, errorResponse, AppError } from '../../../lib/errors.ts';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = complaintSchema.safeParse(body);

    if (!validated.success) {
      return new Response(
        JSON.stringify(
          errorResponse(AppError.badRequest('Validation error', validated.error.format()))
        ),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // In Phase 1: Stub logging; Phase 4+ connects to notification provider and CRM
    console.log('[API /api/contact Received Inquiry]:', validated.data);

    return new Response(
      JSON.stringify(
        successResponse(
          { id: `inq-${Date.now()}`, receivedAt: new Date().toISOString() },
          'Your message has been received. Our terminal customer desk will contact you.'
        )
      ),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify(errorResponse(err)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
