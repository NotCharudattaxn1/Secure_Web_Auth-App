import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// In production, this should be an environment variable.
const secretKey = process.env.SESSION_SECRET || 'a-very-secure-secret-key-that-is-at-least-32-chars-long';
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d') // Session valid for 1 day
    .sign(key);
}

export async function decrypt(input) {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    return null; // Invalid or expired session
  }
}

// XSS Mitigation: We use HttpOnly cookies so JavaScript cannot read the token.
// CSRF Mitigation: SameSite=lax prevents the browser from sending the cookie with cross-site requests.
export async function createSession(user) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session = await encrypt({ user, expires });
  
  const cookieStore = await cookies();
  cookieStore.set('session', session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.set('session', '', {
    expires: new Date(0), // expire immediately
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}
