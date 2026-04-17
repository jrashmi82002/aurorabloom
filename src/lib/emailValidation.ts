// Disposable / fake email domain blocklist + format validation
// Goal: block obvious fakes (test@test.com, mailinator, 10minutemail, etc.)
// while allowing real consumer providers.

const DISPOSABLE_DOMAINS = new Set([
  "test.com", "test.test", "example.com", "example.org", "example.net",
  "fake.com", "asdf.com", "qwerty.com", "abc.com", "xyz.com",
  "mailinator.com", "10minutemail.com", "guerrillamail.com", "tempmail.com",
  "throwaway.email", "trashmail.com", "yopmail.com", "getnada.com",
  "sharklasers.com", "maildrop.cc", "dispostable.com", "fakeinbox.com",
  "tempinbox.com", "tempr.email", "mintemail.com", "spam4.me",
  "mohmal.com", "emailondeck.com", "tempmail.io", "burnermail.io",
  "temp-mail.org", "mailcatch.com", "mailnesia.com", "spambox.us",
  "test123.com", "abc123.com", "user.com", "email.com", "mail.com",
]);

const SUSPICIOUS_LOCAL_PARTS = /^(test|fake|asdf|qwerty|abc|xyz|user|admin|noreply|user\d{0,5}|abc\d{0,5})$/i;

export interface EmailValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateRealEmail(email: string): EmailValidationResult {
  const trimmed = email.trim().toLowerCase();

  // Strict format check (more strict than HTML5)
  const formatRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!formatRegex.test(trimmed)) {
    return { valid: false, reason: "Please enter a valid email address." };
  }

  const [local, domain] = trimmed.split("@");

  // Block obviously fake local parts
  if (SUSPICIOUS_LOCAL_PARTS.test(local)) {
    return { valid: false, reason: "Please use a real personal email address." };
  }

  // Local part length sanity
  if (local.length < 2 || local.length > 64) {
    return { valid: false, reason: "Email username looks invalid." };
  }

  // No consecutive dots, no leading/trailing dot
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) {
    return { valid: false, reason: "Email address has invalid formatting." };
  }

  // Block disposable / fake domains
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { valid: false, reason: "Disposable or fake email domains are not allowed. Please use a real email." };
  }

  // Domain must have a real TLD (2+ chars after final dot, not numeric-only)
  const tld = domain.split(".").pop() || "";
  if (!/^[a-zA-Z]{2,}$/.test(tld)) {
    return { valid: false, reason: "Please use an email with a valid domain." };
  }

  return { valid: true };
}
