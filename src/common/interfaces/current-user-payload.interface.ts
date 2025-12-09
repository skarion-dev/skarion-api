export interface IAuthenticatedUser {
  actor: null;
  azp: string;
  emailVerified: boolean;
  exp: number;
  firstName: string;
  fva: [number, number];
  hasImage: boolean;
  iat: number;
  id: string;
  imageUrl: string;
  iss: string;
  jti: string;
  lastName: string;
  lastSignInAt: number;
  nbf: number;
  primaryEmailAddress: string;
  publicMetadata: Record<string, unknown>;
  sid: string;
  sts: string;
  sub: string;
  username: null;
  v: number;
}
