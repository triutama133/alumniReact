import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    userId,
    email: headersList.get('x-user-email'),
    role: headersList.get('x-user-role'),
    profileCompleted: headersList.get('x-user-profile-completed') === 'true',
    mustChangePassword: headersList.get('x-user-must-change-password') === 'true',
  });
}
