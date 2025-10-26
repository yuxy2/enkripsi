function shiftChar(ch: string, shift: number) {
  const A = 65, Z = 90, a = 97, z = 122;
  const c = ch.charCodeAt(0);
  if (c >= A && c <= Z) return String.fromCharCode(A + ((c - A + shift) % 26 + 26) % 26);
  if (c >= a && c <= z) return String.fromCharCode(a + ((c - a + shift) % 26 + 26) % 26);
  return ch;
}

export const caesarEncrypt = (t: string, s: number) => Array.from(t).map(ch => shiftChar(ch, s)).join("");
export const caesarDecrypt = (t: string, s: number) => caesarEncrypt(t, -s);
