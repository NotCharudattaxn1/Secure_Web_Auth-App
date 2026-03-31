import { NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { getUserByUsername, logAudit, updateUserLockout, resetUserLockout, handleApiError } from '@/lib/db';
import { createSession } from '@/lib/session';
import { z } from 'zod';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req) {
  try {
    const body = await req.json();
    
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { username, password } = result.data;
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';

    const user = await getUserByUsername(username);
    // Generic error message to prevent username enumeration
    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      await logAudit(user.id, 'LOGIN_FAILED_LOCKED', ipAddress);
      return NextResponse.json({ error: 'Account temporarily locked due to multiple failed login attempts. Please try again later.' }, { status: 429 });
    }

    // Constant-time compare operation (handled by bcrypt) to prevent timing attacks
    const isValid = await compare(password, user.password_hash);
    if (!isValid) {
      let attempts = (user.failed_login_attempts || 0) + 1;
      let lockedUntil = null;
      if (attempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      }
      await updateUserLockout(user.id, attempts, lockedUntil);
      await logAudit(user.id, 'LOGIN_FAILED', ipAddress);
      
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Reset lockout counter on success
    await resetUserLockout(user.id);
    await logAudit(user.id, 'LOGIN_SUCCESS', ipAddress);

    // Session creation mitigates session fixation by assigning a fresh session upon auth
    const sessionUser = { id: user.id, username: user.username };
    await createSession(sessionUser);

    return NextResponse.json({ message: 'Logged in successfully', user: sessionUser }, { status: 200 });
  } catch (error) {
    const { error: message, status } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
