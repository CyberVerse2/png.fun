# What's the Nonce For? 🔐

## TL;DR

A **nonce** (Number used ONCE) prevents **replay attacks** - it ensures that a signed message can't be stolen and reused by an attacker.

---

## The Problem Without Nonces

Imagine this scenario **WITHOUT** nonces:

```
1. You sign message: "I am 0x1234... and I want to sign in to PNG.FUN"
2. Your signature: "abc123xyz..."
3. Someone intercepts this signature (network sniffing, logs, etc.)
4. They replay your EXACT same message + signature
5. ❌ Server accepts it because signature is valid!
6. ❌ Attacker can sign in as you FOREVER!
```

**The signature is valid forever** because it's just proving "this wallet signed this message" - but nothing ties it to THIS specific login attempt at THIS specific time.

---

## The Solution: Nonces

With a nonce, each authentication attempt is **unique and one-time use**:

```
1. Server generates random nonce: "5bb90d95de9345af..."
2. Server stores nonce in cookie (short expiration)
3. You sign message: "Sign in with nonce: 5bb90d95de9345af..."
4. Server verifies:
   a. Signature is valid ✓
   b. Nonce matches what's in cookie ✓
   c. Nonce hasn't been used before ✓
5. Server deletes nonce (can never be used again)
6. ✅ You're authenticated!

If attacker tries to replay:
7. They send same signature with same nonce
8. ❌ Server rejects: "Nonce already used" or "Nonce doesn't match cookie"
```

---

## How It Works in Your App

### Step 1: Generate Nonce (Backend)

**File**: `app/api/nonce/route.ts`

```typescript
const nonce = crypto.randomUUID().replace(/-/g, '');
// Example: "5bb90d95de9345af96eb6cf035075d58"

cookieStore.set('siwe', nonce, {
  maxAge: 600, // Expires in 10 minutes
  httpOnly: true // JavaScript can't access it (XSS protection)
});
```

**Why random?** So nobody can guess what the nonce will be.

**Why store in cookie?** So the server remembers which nonce it gave YOU.

**Why 10 minutes?** Long enough to complete auth, short enough to limit attack window.

---

### Step 2: Sign Message with Nonce (Frontend)

**File**: `components/minikit-provider.tsx`

```typescript
const { nonce } = await fetch('/api/nonce').then((r) => r.json());

// User signs THIS specific nonce with their wallet
const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
  nonce, // The nonce is embedded in the SIWE message
  statement: 'Sign in to PNG.FUN'
});
```

**What the user signs:**

```
PNG.FUN wants you to sign in with your Ethereum account:
0xe0359303ee2c737dc38267bc491ba80cfb4be0d2

Sign in to PNG.FUN

URI: https://your-app.com
Version: 1
Chain ID: 1
Nonce: 5bb90d95de9345af96eb6cf035075d58  ← HERE!
Issued At: 2025-11-22T20:57:42Z
```

The **signature proves**:

- This wallet (0xe0359...)
- Signed this exact message
- Including this exact nonce
- At this exact time

---

### Step 3: Verify Nonce (Backend)

**File**: `app/api/complete-siwe/route.ts`

```typescript
// 1. Get the nonce from the signed message
const { nonce } = await req.json();

// 2. Get the nonce we stored earlier from cookie
const storedNonce = cookieStore.get('siwe')?.value;

// 3. They MUST match
if (storedNonce !== nonce) {
  return error('Invalid nonce'); // ❌ Replay attack!
}

// 4. Verify the cryptographic signature
const validMessage = await verifySiweMessage(payload, nonce);
if (!validMessage.isValid) {
  return error('Invalid signature'); // ❌ Forged!
}

// 5. Delete the nonce (one-time use only)
cookieStore.delete('siwe');

// ✅ Authentication successful!
```

---

## Real-World Attack Scenarios Prevented

### Attack 1: Replay Attack

**Without nonce:**

```
Attacker: *captures your auth request*
Attacker: *sends same request 1 hour later*
Server: "Signature valid! Welcome back!" ❌
```

**With nonce:**

```
Attacker: *captures your auth request*
Attacker: *sends same request 1 hour later*
Server: "Nonce already used/expired!" ✓ Rejected!
```

---

### Attack 2: Pre-computed Attack

**Without nonce:**

```
Attacker: "Let me pre-sign a bunch of messages for victim's wallet"
Attacker: *somehow gets victim to sign generic message*
Attacker: *uses pre-computed signature*
Server: "Valid!" ❌
```

**With nonce:**

```
Attacker: "I need to know the nonce first..."
Server: *generates random nonce*
Attacker: "I can't pre-compute because nonce is random!" ✓
```

---

### Attack 3: Cross-Site Attack

**Without nonce:**

```
Evil site: "Sign this message to claim your prize!"
User: *signs message that's actually for PNG.FUN*
Attacker: *uses signature on PNG.FUN*
Server: "Valid signature!" ❌
```

**With nonce:**

```
Evil site: "Sign this message to claim your prize!"
User: *signs message with evil site's nonce*
Attacker: *tries to use on PNG.FUN*
Server: "Nonce doesn't match my cookie!" ✓ Rejected!
```

---

## Why HTTP-Only Cookie?

The nonce is stored in an **HTTP-only cookie**, which means:

```typescript
cookieStore.set('siwe', nonce, {
  httpOnly: true // ← JavaScript can't read this!
});
```

**Why?**

- **XSS Protection**: If attacker injects malicious JavaScript into your site, they can't steal the nonce
- **Server-side verification**: Only the server can read the cookie, not the frontend
- **Automatic sending**: Browser automatically sends cookie with requests

**Comparison:**

| Storage          | JavaScript Can Read? | Vulnerable to XSS?   |
| ---------------- | -------------------- | -------------------- |
| localStorage     | ✅ Yes               | ❌ Yes (very risky!) |
| HTTP-only Cookie | ❌ No                | ✅ No (secure!)      |
| Memory only      | ✅ Yes               | ❌ Yes               |

---

## The Complete Flow (Simplified)

```
┌─────────────────────────────────────────────────────────┐
│ 1. User clicks "Sign In"                                │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Frontend → Backend: "Give me a nonce"               │
│    Backend generates random nonce: "abc123..."          │
│    Backend stores in cookie                             │
│    Backend returns nonce to frontend                    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Frontend asks user to sign message with nonce       │
│    User sees: "Sign in to PNG.FUN... Nonce: abc123..." │
│    User's wallet signs message                          │
│    Creates cryptographic signature                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Frontend → Backend: "Here's my signature"           │
│    Sends: { signature, nonce: "abc123...", ... }       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Backend Verification                                 │
│                                                         │
│    a) Check cookie nonce === sent nonce                │
│       "abc123..." === "abc123..." ✓                    │
│                                                         │
│    b) Verify signature is cryptographically valid      │
│       Signature proves wallet signed this message ✓    │
│                                                         │
│    c) Delete nonce from cookie                         │
│       Can never be used again ✓                        │
│                                                         │
│    ✅ User is authenticated!                            │
└─────────────────────────────────────────────────────────┘
```

---

## Key Properties of a Good Nonce

1. ✅ **Random** - Unpredictable, can't be guessed
2. ✅ **Unique** - Never reused (hence "used ONCE")
3. ✅ **Time-limited** - Expires after 10 minutes
4. ✅ **Server-validated** - Only server knows if it's valid
5. ✅ **Securely stored** - HTTP-only cookie, not accessible to JavaScript

---

## What If Nonces Didn't Expire?

**With 10-minute expiry (current):**

```
User starts auth: 12:00 PM
User completes auth: 12:02 PM ✓
Attacker tries replay: 12:15 PM ❌ (expired + deleted)
```

**Without expiry (bad!):**

```
User starts auth: 12:00 PM
User completes auth: 12:02 PM ✓
Nonce deleted: 12:02 PM
Attacker tries replay: 12:15 PM ❌ (deleted, still protected)

BUT if they intercept BEFORE completion:
User starts auth: 12:00 PM
Attacker intercepts: 12:01 PM
Attacker waits: 5 hours...
Attacker uses nonce: 5:00 PM ❌ With expiry: rejected! ✓
                               Without expiry: valid! ❌
```

**The expiry adds a time-window limit** - even if nonce isn't deleted, it becomes invalid after 10 minutes.

---

## Why SIWE (Sign-In with Ethereum)?

SIWE is a **standard protocol** (like "Sign in with Google") for wallet-based authentication.

**Benefits:**

- ✅ Industry standard (EIP-4361)
- ✅ Includes nonce automatically
- ✅ Includes timestamp (prevents old signatures)
- ✅ Includes domain (prevents cross-site attacks)
- ✅ Cryptographically secure
- ✅ No password needed

**The signed message includes:**

```
Domain: your-app.com        ← Can't use on another site
Nonce: abc123...            ← One-time use
Issued At: 2025-11-22       ← Can't use old signature
Expiration: 2025-11-29      ← Limited lifetime
```

All of these work together to make authentication secure!

---

## Summary

**Nonce = Proof that this authentication is happening RIGHT NOW**

Without it:

- ❌ Signatures can be replayed forever
- ❌ Attackers can impersonate you indefinitely
- ❌ No way to know if auth is fresh or old

With it:

- ✅ Each auth attempt is unique
- ✅ Signatures expire quickly
- ✅ Replay attacks are impossible
- ✅ Server controls who gets in

**It's like a one-time password that's embedded in your signature!**

---

## Further Reading

- [EIP-4361: Sign-In with Ethereum](https://eips.ethereum.org/EIPS/eip-4361)
- [SIWE Specification](https://login.xyz/)
- [Replay Attack Prevention](https://en.wikipedia.org/wiki/Replay_attack)
- [Nonce in Cryptography](https://en.wikipedia.org/wiki/Cryptographic_nonce)
