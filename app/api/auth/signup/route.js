import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { getUserByUsername, createUser, handleApiError } from '@/lib/db';
import { userSchema } from '@/lib/validations';
import { createSession } from '@/lib/session';

export async function POST(req) {
  try {
    const body = await req.json();
    
    // Mitigating attacks by enforcing strict validation schema before processing
    // This blocks overly long inputs, bad characters, etc.
    const result = userSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { username, password } = result.data;

    // Check if user exists using parameterized queries
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }

    // Secure password hashing with work factor of 12
    const hashedPassword = await hash(password, 12);

    // Save user to database
    const user = await createUser(username, hashedPassword);

    // Immediately log the user in by issuing an HttpOnly session cookie
    await createSession(user);

    return NextResponse.json({ message: 'User created successfully', user }, { status: 201 });
  } catch (error) {
    const { error: message, status } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
