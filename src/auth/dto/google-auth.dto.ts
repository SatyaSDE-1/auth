// src/auth/dto/google-auth.dto.ts
export interface GoogleUserProfile {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  accessToken: string;   // Google's own access token (not ours)
}