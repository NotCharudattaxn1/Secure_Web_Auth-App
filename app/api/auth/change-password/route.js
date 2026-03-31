import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getUserByUsername, changeUserPassword, logAudit, handleApiError } from '@/lib/db';
import { compare, hash } from 'bcryptjs';
import { z } from 'zod';

const passwordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
});

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const result = passwordSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { currentPassword, newPassword } = result.data;

    // Get the current user
    const user = await getUserByUsername(session.user.username);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isValid = await compare(currentPassword, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
    }

    // Hash and update to new password
    const newPasswordHash = await hash(newPassword, 12);
    await changeUserPassword(user.id, newPasswordHash);

    // Log the event
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    await logAudit(user.id, 'PASSWORD_CHANGED', ipAddress);

    return NextResponse.json({ message: 'Password updated successfully' }, { status: 200 });

  } catch (error) {
    const { error: message, status } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
