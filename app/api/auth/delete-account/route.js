import { NextResponse } from 'next/server';
import { getSession, destroySession } from '@/lib/session';
import { getUserByUsername, deleteUser, handleApiError } from '@/lib/db';
import { compare } from 'bcryptjs';
import { z } from 'zod';

const deleteSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export async function DELETE(req) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const result = deleteSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { password } = result.data;

    // Re-authenticate before deleting — prevents CSRF-based deletions
    const user = await getUserByUsername(session.user.username);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isValid = await compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Incorrect password. Account not deleted.' }, { status: 403 });
    }

    // Delete user (CASCADE will remove their audit_logs too)
    await deleteUser(user.id);

    // Destroy the session cookie so they are logged out immediately
    await destroySession();

    return NextResponse.json({ message: 'Account deleted successfully.' }, { status: 200 });
  } catch (error) {
    const { error: message, status } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
