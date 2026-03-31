import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getUserAuditLogs } from '@/lib/db';

export async function GET(req) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const logs = await getUserAuditLogs(session.user.id);
    return NextResponse.json({ logs }, { status: 200 });
  } catch (error) {
    console.error('Audit log fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
