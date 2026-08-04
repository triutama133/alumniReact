import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

export const AUTH_COOKIE_NAME = 'auth_token';
export const AUTH_AUDIENCE = 'authenticated';
export const AUTH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

export type AuthTokenPayload = JWTPayload & {
  email?: string;
  role?: string;
  username?: string;
  profile_completed?: boolean;
  must_change_password?: boolean;
  auth_version?: number;
};

function getJwtSecret() {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return new TextEncoder().encode(jwtSecret);
}

export async function signAuthToken(payload: AuthTokenPayload) {
  const secret = getJwtSecret();

  return new SignJWT({
    email: payload.email,
    role: payload.role,
    username: payload.username,
    profile_completed: payload.profile_completed,
    must_change_password: payload.must_change_password,
    auth_version: payload.auth_version,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(payload.sub))
    .setAudience(AUTH_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${AUTH_TOKEN_TTL_SECONDS}s`)
    .sign(secret);
}

export async function verifyAuthToken(token: string) {
  const secret = getJwtSecret();
  const { payload } = await jwtVerify<AuthTokenPayload>(token, secret, {
    algorithms: ['HS256'],
    audience: AUTH_AUDIENCE,
  });

  return payload;
}
