import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { lookupUserForAdmin, listAllUsers } from '@/lib/db';

// Force Next.js to never cache this route — data must always be live from the DB.
export const dynamic = 'force-dynamic';

// GET /api/admin/user-lookup?username=foo  → lookup single user
// GET /api/admin/user-lookup               → list all users
export async function GET(req) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username')?.trim();

    if (username) {
      const user = await lookupUserForAdmin(username);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ user }, {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    // No query param → return all users
    const users = await listAllUsers();
    return NextResponse.json({ users }, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Admin user lookup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
