import { randomBytes } from "node:crypto";
import { safeEqualSecret } from "../security/secret-equal.js";

export const PAIRING_TOKEN_BYTES = 32;
export const DEFAULT_TOKEN_EXPIRY_MS = 365 * 24 * 60 * 60 * 1000; // 1 year

export function generatePairingToken(expiresInMs?: number): {
  token: string;
  expiresAtMs?: number;
} {
  const token = randomBytes(PAIRING_TOKEN_BYTES).toString("base64url");
  const expiresAtMs = expiresInMs ? Date.now() + expiresInMs : undefined;
  return { token, expiresAtMs };
}

export function verifyPairingToken(
  provided: string,
  expected: string,
  expiresAtMs?: number,
): boolean {
  // Check expiration if provided
  if (expiresAtMs && Date.now() > expiresAtMs) {
    return false;
  }
  return safeEqualSecret(provided, expected);
}
