// ── SHA-256 Password Hashing ──────────────────────────────────────────────────
// Browser built-in Web Crypto API — কোনো extra package লাগবে না

export async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// ── Phone or Email identifier detect ────────────────────────────────────────
// @ থাকলে email, না থাকলে phone
export function isEmail(identifier: string): boolean {
  return identifier.includes('@');
}
