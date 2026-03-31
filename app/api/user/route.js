import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET() {
  // Verifying JWT ensures the token has not been tampered with
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ user: session.user }, { status: 200 });
}
