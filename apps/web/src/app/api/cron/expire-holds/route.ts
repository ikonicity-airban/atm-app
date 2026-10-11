import { bookingRepository } from '../../../../server/repositories/bookings.ts';
import { jsonResponse } from '../../../../lib/errors.ts';

export async function GET(req: Request) {
  return handleExpire(req);
}

export async function POST(req: Request) {
  return handleExpire(req);
}

async function handleExpire(req: Request) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
  }

  const expiredCount = await bookingRepository.expireOldHolds();
  return jsonResponse({
    success: true,
    message: `Expired ${expiredCount} hold(s)`,
    expiredCount,
    timestamp: new Date().toISOString(),
  });
}
