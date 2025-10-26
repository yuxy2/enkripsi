const te = new TextEncoder();
const td = new TextDecoder();

export async function deriveAesKeyFromPassword(password: string, salt: ArrayBuffer | Uint8Array) {
  const subtle = crypto.subtle;
  const toArrayBufferStrict = (src: ArrayBuffer | Uint8Array): ArrayBuffer => {
    if (src instanceof Uint8Array) {
      const copy = new Uint8Array(src.length);
      copy.set(src);
      return copy.buffer;
    }
    return src.slice(0);
  };
  const saltAB = toArrayBufferStrict(salt);
  const baseKey = await subtle.importKey("raw", te.encode(password), "PBKDF2", false, ["deriveKey"]);
  return subtle.deriveKey(
    { name: "PBKDF2", salt: saltAB, iterations: 100_000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptAES_GCM(plaintext: string, password: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveAesKeyFromPassword(password, salt);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, te.encode(plaintext));
  const out = new Uint8Array(salt.length + iv.length + cipher.byteLength);
  out.set(salt, 0);
  out.set(iv, salt.length);
  out.set(new Uint8Array(cipher), salt.length + iv.length);
  return btoa(String.fromCharCode(...out));
}

export async function decryptAES_GCM(bundle: string, password: string) {
  const bin = atob(bundle);
  const all = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  const salt = all.slice(0, 16);
  const iv = all.slice(16, 28);
  const cipher = all.slice(28);
  const key = await deriveAesKeyFromPassword(password, salt);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
  return td.decode(plain);
}
