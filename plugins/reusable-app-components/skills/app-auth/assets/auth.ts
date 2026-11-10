export type OAuthProvider = {
  id: string
  label: string
  endpoint: string
}

export type EmailAuthPurpose = "signup" | "reset"

export type EmailAuthAdapter<User, Recovery> = {
  login: (
    input: { email: string; password: string },
    signal: AbortSignal,
  ) => Promise<User>;
  register: (
    input: { email: string; password: string; acceptedTerms: boolean },
    signal: AbortSignal,
  ) => Promise<void>;
  sendCode: (
    input: { email: string; purpose: EmailAuthPurpose },
    signal: AbortSignal,
  ) => Promise<void>;
  verifyEmail: (
    input: { email: string; code: string },
    signal: AbortSignal,
  ) => Promise<User>;
  verifyResetCode: (
    input: { email: string; code: string },
    signal: AbortSignal,
  ) => Promise<Recovery>;
  resetPassword: (
    input: { recovery: Recovery; password: string },
    signal: AbortSignal,
  ) => Promise<User>;
};
