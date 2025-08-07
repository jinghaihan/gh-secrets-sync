import type { PublicKey } from './types'
import sodium from 'libsodium-wrappers'

// https://docs.github.com/en/rest/guides/encrypting-secrets-for-the-rest-api?apiVersion=2022-11-28
export async function encrypt(value: string, publicKey: PublicKey): Promise<string> {
  await sodium.ready

  // Convert the secret and key to a Uint8Array.
  const binkey = sodium.from_base64(publicKey.key, sodium.base64_variants.ORIGINAL)
  const binsec = sodium.from_string(value)

  // Encrypt the secret using the public key.
  const encrypted = sodium.crypto_box_seal(binsec, binkey)

  // Convert the encrypted secret to a base64 string.
  return sodium.to_base64(encrypted, sodium.base64_variants.ORIGINAL)
}
