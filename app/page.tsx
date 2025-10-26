"use client";

import React from "react";
import { decryptAES_GCM, encryptAES_GCM } from "./lib/crypto/aes";
import { caesarDecrypt, caesarEncrypt } from "./lib/crypto/caesar";


export default function Page() {
  const [method, setMethod] = React.useState<"aes" | "caesar">("aes");
  const [plain, setPlain] = React.useState("");
  const [cipher, setCipher] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [shift, setShift] = React.useState(3);
  const [outEnc, setOutEnc] = React.useState("");
  const [outDec, setOutDec] = React.useState("");
  const [status, setStatus] = React.useState<string | null>(null);

  const onEncrypt = async () => {
    setStatus(null);
    setOutDec("");
    try {
      if (method === "aes") {
        if (!password) throw new Error("Password wajib diisi untuk AES.");
        const c = await encryptAES_GCM(plain, password);
        setCipher(c);
        setOutEnc(c);
        setStatus("Enkripsi AES berhasil.");
      } else {
        const c = caesarEncrypt(plain, shift);
        setCipher(c);
        setOutEnc(c);
        setStatus("Enkripsi Caesar berhasil.");
      }
    } catch (e: any) {
      setStatus(`Gagal enkripsi: ${e?.message ?? e}`);
    }
  };

  const onDecrypt = async () => {
    setStatus(null);
    try {
      if (method === "aes") {
        if (!password) throw new Error("Password wajib diisi untuk AES.");
        const p = await decryptAES_GCM(cipher, password);
        setOutDec(p);
        setStatus("Dekripsi AES berhasil.");
      } else {
        const p = caesarDecrypt(cipher, shift);
        setOutDec(p);
        setStatus("Dekripsi Caesar berhasil.");
      }
    } catch (e: any) {
      setStatus(`Gagal dekripsi: ${e?.message ?? e}`);
    }
  };

  const loadSample = () => {
    setPlain("Halo dunia! Ini contoh enkripsi.");
    setCipher("");
    setPassword("rahasia-ku");
    setShift(3);
    setOutEnc("");
    setOutDec("");
    setStatus("Contoh dimuat.");
  };

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold">Demo Enkripsi Simetris — AES-GCM & Caesar</h1>
      <p className="text-sm text-gray-600 mt-1">
        Masukkan teks, pilih metode, lalu <b>Enkripsi</b> / <b>Dekripsi</b>. Hasil tampil di bawah.
      </p>

      <div className="mt-4 grid gap-4">
        {/* Kartu utama */}
        <div className="rounded-2xl border p-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold">Teks Asli (Plaintext)</label>
              <textarea
                className="textarea textarea-bordered w-full h-36 mt-1"
                placeholder="contoh: Halo dunia!"
                value={plain}
                onChange={(e) => setPlain(e.target.value)}
              />
            </div>
            <div>
              <label className="font-semibold">Teks Terenkripsi (Ciphertext)</label>
              <textarea
                className="textarea textarea-bordered w-full h-36 mt-1"
                placeholder="AES: base64 salt+iv+cipher · Caesar: teks bergeser"
                value={cipher}
                onChange={(e) => setCipher(e.target.value)}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="font-semibold">Metode</label>
              <select
                className="select select-bordered w-full mt-1"
                value={method}
                onChange={(e) => {
                  const m = e.target.value as "aes" | "caesar";
                  setMethod(m);
                  setOutEnc("");
                  setOutDec("");
                  setStatus(null);
                }}
              >
                <option value="aes">AES-GCM (password)</option>
                <option value="caesar">Caesar Cipher (shift)</option>
              </select>
            </div>

            {method === "aes" ? (
              <div>
                <label className="font-semibold">Password (AES-GCM)</label>
                <input
                  type="password"
                  className="input input-bordered w-full mt-1"
                  placeholder="mis. rahasia-ku"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  PBKDF2 100.000 iterasi (SHA-256) → kunci AES-256; IV acak 12B.
                  Output base64: [salt(16B)‖iv(12B)‖cipher].
                </p>
              </div>
            ) : (
              <div>
                <label className="font-semibold">Shift (Caesar)</label>
                <input
                  type="number"
                  className="input input-bordered w-full mt-1"
                  value={shift}
                  onChange={(e) => setShift(parseInt(e.target.value || "0", 10))}
                />
                <p className="text-xs text-gray-500 mt-1">Hanya A–Z/a–z. Untuk edukasi.</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <button className="btn btn-primary" onClick={onEncrypt}>Enkripsi →</button>
            <button className="btn" onClick={onDecrypt}>← Dekripsi</button>
            <button className="btn btn-ghost" onClick={loadSample}>Isi Contoh</button>
          </div>

          {status && (
            <div className={`mt-2 text-sm ${status.startsWith("Gagal") ? "text-rose-700" : "text-emerald-700"}`}>
              {status}
            </div>
          )}
        </div>

        {/* Output */}
        <div className="rounded-2xl border p-4">
          <h3 className="font-semibold mb-2">Output</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold">Hasil Enkripsi</label>
              <textarea className="textarea textarea-bordered w-full h-40 mt-1" readOnly value={outEnc} />
            </div>
            <div>
              <label className="font-semibold">Hasil Dekripsi</label>
              <textarea className="textarea textarea-bordered w-full h-40 mt-1" readOnly value={outDec} />
            </div>
          </div>
        </div>

        {/* Catatan */}
        <div className="rounded-2xl border p-4">
          <h3 className="font-semibold mb-2">Catatan</h3>
          <ul className="text-sm list-disc pl-5 space-y-1">
            <li><b>AES-GCM</b> aman untuk penggunaan umum browser. Simpan string base64 untuk dekripsi ulang.</li>
            <li><b>Caesar</b> untuk demo/edukasi (tidak aman produksi).</li>
            <li>Komponen ini client-only (Web Crypto API). Tidak berjalan di SSR.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
