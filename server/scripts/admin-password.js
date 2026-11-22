// Run once: npm run admin-password
// Give the password to the admins; put the hash in the server env as ADMIN_PASSWORD_SHA256.
// SHA-256 (fast) is fine here only because the password is random: 16 chars × 62 symbols ≈ 95 bits.
// Never reuse this for human-chosen passwords.
import { createHash, randomInt } from 'node:crypto'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const password = Array.from({ length: 16 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')

console.log(`password:              ${password}`)
console.log(`ADMIN_PASSWORD_SHA256: ${createHash('sha256').update(password).digest('hex')}`)
