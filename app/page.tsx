"use client";

import React from "react";
import { decryptAES_GCM, encryptAES_GCM } from "./lib/crypto/aes";
import { caesarDecrypt, caesarEncrypt } from "./lib/crypto/caesar";

/** Theme toggle helper */
function useTheme() {
  const [theme, setTheme] = React.useState<"light" | "dark">("light");
  React.useEffect(() => {
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const saved = (localStorage.getItem("theme") as "light" | "dark") || (prefersDark ? "dark" : "light");
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);
  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };
  return { theme, toggle };
}

// --- Komponen Alat Enkripsi (Dipisah untuk kejelasan) ---
function EncryptionTool() {
  const [method, setMethod] = React.useState<"aes" | "caesar">("aes");
  const [plain, setPlain] = React.useState("");
  const [cipher, setCipher] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [shift, setShift] = React.useState(3);
  const [outEnc, setOutEnc] = React.useState("");
  const [outDec, setOutDec] = React.useState("");
  const [status, setStatus] = React.useState<string | null>(null);

  const [hint, setHint] = React.useState<string | null>(null);
  const flash = (msg: string) => {
    setHint(msg);
    setTimeout(() => setHint(null), 1500);
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text || "");
      flash("✅ Disalin ke clipboard");
    } catch {
      flash("⚠️ Gagal menyalin");
    }
  };

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
    flash("✨ Contoh dimasukkan");
  };

  const clearAll = () => {
    setPlain("");
    setCipher("");
    setPassword("");
    setOutEnc("");
    setOutDec("");
    setStatus(null);
  };

  return (
    <div className="rounded-3xl border border-base-300/60 bg-base-100/70 backdrop-blur-xl shadow-2xl p-5 md:p-7">
      <h2 className="text-2xl font-bold mb-4 text-base-content">Alat Enkripsi & Dekripsi</h2>
      {/* Controls row */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label"><span className="label-text font-semibold">Teks Asli (Plaintext)</span></label>
          <textarea className="textarea textarea-bordered h-36 w-full focus:outline-none focus:textarea-primary transition-all" placeholder="contoh: Halo dunia!" value={plain} onChange={(e) => setPlain(e.target.value)} />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text font-semibold">Teks Terenkripsi (Ciphertext)</span></label>
          <div className="relative">
            <textarea className="textarea textarea-bordered h-36 w-full pr-24 focus:outline-none focus:textarea-primary transition-all" placeholder="AES: base64 [salt‖iv‖cipher] • Caesar: hasil pergeseran" value={cipher} onChange={(e) => setCipher(e.target.value)} />
            <div className="absolute right-2 top-2 flex gap-2">
              <button className="btn btn-sm" onClick={() => copy(cipher)} title="Copy ciphertext">📋 Copy</button>
              <button className="btn btn-sm btn-ghost" onClick={() => setCipher("")} title="Clear">✖</button>
            </div>
          </div>
        </div>
      </div>

      {/* Method & params */}
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div className="form-control">
          <label className="label"><span className="label-text font-semibold">Metode</span></label>
          <select className="select select-bordered w-full" value={method} onChange={(e) => { const m = e.target.value as "aes" | "caesar"; setMethod(m); setOutEnc(""); setOutDec(""); setStatus(null); }}>
            <option value="aes">🔒 AES-GCM (password)</option>
            <option value="caesar">🔁 Caesar Cipher (shift)</option>
          </select>
        </div>
        {method === "aes" ? (
          <div className="form-control">
            <label className="label"><span className="label-text font-semibold">Password (AES-GCM)</span></label>
            <input type="password" className="input input-bordered w-full focus:outline-none focus:input-primary" placeholder="mis. rahasia-ku" value={password} onChange={(e) => setPassword(e.target.value)} />
            <p className="text-xs opacity-70 mt-2">PBKDF2 100.000 iterasi (SHA-256) → AES-256; IV acak 12B. Output Base64: <code>[salt(16B)‖iv(12B)‖cipher]</code>.</p>
          </div>
        ) : (
          <div className="form-control">
            <label className="label"><span className="label-text font-semibold">Shift (Caesar)</span></label>
            <input type="number" className="input input-bordered w-full focus:outline-none focus:input-primary" value={shift} onChange={(e) => setShift(parseInt(e.target.value || "0", 10))} />
            <p className="text-xs opacity-70 mt-2">Menggeser huruf A–Z/a–z. Untuk edukasi.</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mt-5">
        <button className="btn btn-primary gap-2" onClick={onEncrypt}>🔐 Enkripsi</button>
        <button className="btn gap-2" onClick={onDecrypt}>🔓 Dekripsi</button>
        <button className="btn btn-ghost" onClick={loadSample}>✨ Isi Contoh</button>
        <button className="btn btn-ghost" onClick={clearAll}>🧹 Bersihkan</button>
      </div>

      {/* Status */}
      {status && <div className={`mt-3 text-sm ${status.startsWith("Gagal") ? "text-error" : "text-success"}`}>{status}</div>}

      {/* Output cards */}
      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <div className="card bg-base-200/60 border">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <h3 className="card-title text-base">Hasil Enkripsi</h3>
              <div className="flex gap-2"><button className="btn btn-xs" onClick={() => copy(outEnc)}>📋 Copy</button><button className="btn btn-xs btn-ghost" onClick={() => setOutEnc("")}>✖</button></div>
            </div>
            <textarea className="textarea textarea-ghost h-40 w-full" readOnly value={outEnc} />
          </div>
        </div>
        <div className="card bg-base-200/60 border">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <h3 className="card-title text-base">Hasil Dekripsi</h3>
              <div className="flex gap-2"><button className="btn btn-xs" onClick={() => copy(outDec)}>📋 Copy</button><button className="btn btn-xs btn-ghost" onClick={() => setOutDec("")}>✖</button></div>
            </div>
            <textarea className="textarea textarea-ghost h-40 w-full" readOnly value={outDec} />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="mt-6">
        <div className="collapse collapse-arrow bg-base-200/60 border">
          <input type="checkbox" />
          <div className="collapse-title font-semibold">Catatan</div>
          <div className="collapse-content">
            <ul className="text-sm list-disc pl-5 space-y-1">
              <li><b>AES-GCM</b> aman & umum di browser. Simpan string Base64 untuk dekripsi ulang.</li>
              <li><b>Caesar</b> cocok untuk demo/edukasi (tidak aman produksi).</li>
              <li>Komponen ini client-only (Web Crypto API). Tidak berjalan di SSR.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}


// --- Komponen Halaman Utama (Presentasi) ---
export default function Page() {
  const { theme, toggle } = useTheme();
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const totalSlides = 8;

  const slides = [
    "Judul",
    "Apa itu Enkripsi?",
    "Caesar Cipher",
    "AES-GCM",
    "Petunjuk Demo",
    "Demo Interaktif",
    "Perbandingan",
    "Kesimpulan",
  ];

  const nextSlide = () => setCurrentSlide((s) => Math.min(s + 1, totalSlides - 1));
  const prevSlide = () => setCurrentSlide((s) => Math.max(s - 1, 0));

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-300 to-base-200" style={{ backgroundImage: "radial-gradient(24rem 24rem at 10% 10%, hsl(var(--p)/0.08) 0%, transparent 60%), radial-gradient(22rem 22rem at 90% 20%, hsl(var(--s)/0.08) 0%, transparent 60%), radial-gradient(26rem 26rem at 30% 90%, hsl(var(--a)/0.08) 0%, transparent 60%)", }}>
      <main className="mx-auto max-w-6xl p-6 md:p-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-base-content">Enkripsi & Dekripsi</h1>
            <p className="text-sm opacity-70 mt-1 text-base-content">Pelajari dasar-dasar keamanan digital dan coba sendiri alatnya.</p>
          </div>
          <button className="btn btn-outline" onClick={toggle} aria-label="Toggle theme" title="Toggle Light/Dark">{theme === "dark" ? "🌞 Light" : "🌙 Dark"}</button>
        </div>

        {/* Table of Contents */}
        <div className="flex flex-wrap gap-2 mb-6 p-4 bg-base-100/50 rounded-xl backdrop-blur">
          {slides.map((title, index) => (
            <button key={index} onClick={() => setCurrentSlide(index)} className={`btn btn-sm ${currentSlide === index ? "btn-primary" : "btn-ghost"}`}>{index + 1}. {title}</button>
          ))}
        </div>

        {/* Slide Content Area */}
        <div className="rounded-3xl border border-base-300/60 bg-base-100/70 backdrop-blur-xl shadow-2xl p-5 md:p-10 min-h-[500px] flex flex-col">
          {/* Slide 1: Title */}
          {currentSlide === 0 && (
            <div className="flex-grow flex flex-col justify-center items-center text-center">
              <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-base-content">Melindungi Data di Era Digital</h1>
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">Enkripsi & Dekripsi</h2>
              <p className="text-lg opacity-80 text-base-content">Presentasi Interaktif dengan AES-GCM & Caesar Cipher</p>
            </div>
          )}

          {/* Slide 2: What is Encryption? */}
          {currentSlide === 1 && (
            <div className="prose prose-lg max-w-none">
              <h2>Apa itu Enkripsi dan Mengapa Penting?</h2>
              <blockquote className="border-l-4 border-primary pl-4 italic">Bayangkan Anda ingin mengirim surat rahasia. Agar tidak ada yang bisa membacanya, Anda memasukkannya ke dalam kotak yang terkunci. Hanya orang yang memiliki kunci yang tepat yang bisa membukanya.</blockquote>
              <p>Dalam dunia digital, <strong>enkripsi</strong> adalah "mengunci" data, dan <strong>dekripsi</strong> adalah "membuka kunci" data tersebut.</p>
              <h3>Istilah Penting:</h3>
              <ul>
                <li><strong>Plaintext:</strong> Pesan asli yang bisa dibaca siapa saja (contoh: <code>Halo Dunia</code>).</li>
                <li><strong>Ciphertext:</strong> Pesan yang sudah diacak (terenkripsi) dan tidak bisa dibaca (contoh: <code>s5pL9xKq...</code>).</li>
                <li><strong>Enkripsi:</strong> Proses mengubah <em>plaintext</em> menjadi <em>ciphertext</em>.</li>
                <li><strong>Dekripsi:</strong> Proses mengembalikan <em>ciphertext</em> ke <em>plaintext</em>.</li>
                <li><strong>Kunci (Key):</strong> "Rahasia" yang digunakan untuk proses enkripsi dan dekripsi.</li>
              </ul>
              <p><strong>Mengapa penting?</strong> Untuk menjaga <strong>kerahasiaan (confidentiality)</strong> dan <strong>integritas (integrity)</strong> data kita dari akses yang tidak sah.</p>
            </div>
          )}

          {/* Slide 3: Caesar Cipher */}
          {currentSlide === 2 && (
            <div className="prose prose-lg max-w-none">
              <h2>Metode Enkripsi Klasik: Caesar Cipher</h2>
              <p>Salah satu metode enkripsi tertua dan paling sederhana, yang digunakan oleh Julius Caesar.</p>
              <h3>Cara Kerja:</h3>
              <p>Setiap huruf dalam plaintext digeser sejumlah posisi tertentu (disebut <em>shift</em>) dalam alfabet.</p>
              <h3>Contoh (Shift = 3):</h3>
              <ul>
                <li><code>A</code> menjadi <code>D</code></li>
                <li><code>B</code> menjadi <code>E</code></li>
                <li><code>X</code> menjadi <code>A</code> (putaran)</li>
              </ul>
              <div className="bg-base-200 p-4 rounded-lg">
                <p><strong>Plaintext:</strong> <code>Halo</code></p>
                <p><strong>Ciphertext:</strong> <code>Kdor</code></p>
              </div>
              <p><strong>Kelemahan:</strong> Sangat tidak aman untuk kebutuhan modern karena mudah dipecahkan dengan analisis frekuensi huruf. Namun, sangat bagus untuk memahami konsep dasar enkripsi.</p>
            </div>
          )}

          {/* Slide 4: AES-GCM */}
          {currentSlide === 3 && (
            <div className="prose prose-lg max-w-none">
              <h2>Standar Keamanan Modern: AES-GCM</h2>
              <p><strong>A</strong>dvanced <strong>E</strong>ncryption <strong>S</strong>tandard - <strong>G</strong>alois/<strong>C</strong>ounter <strong>M</strong>ode adalah standar enkripsi simetris yang paling banyak digunakan dan diakui keamanannya saat ini.</p>
              <h3>Cara Kerja (disederhanakan):</h3>
              <ol>
                <li><strong>Enkripsi Simetris:</strong> Menggunakan kunci yang sama untuk enkripsi dan dekripsi.</li>
                <li><strong>Password & Kunci:</strong> Password yang Anda masukkan tidak langsung digunakan. Ia diolah melalui fungsi <strong>PBKDF2</strong> (dengan <em>salt</em> acak) untuk menghasilkan kunci enkripsi yang kuat dan unik. Ini mencegah serangan <em>dictionary attack</em>.</li>
                <li><strong>GCM Mode:</strong> Mode ini tidak hanya mengenkripsi data (memberikan kerahasiaan) tetapi juga menambahkan <em>tag</em> autentikasi. Tag ini memastikan data tidak diubah oleh pihak lain selama transit (memberikan integritas).</li>
              </ol>
              <p><strong>Keamanan:</strong> Sangat tinggi. Digunakan dalam HTTPS (amannya browsing), VPN, dan enkripsi file.</p>
            </div>
          )}

          {/* Slide 5: Instructions */}
          {currentSlide === 4 && (
            <div className="prose prose-lg max-w-none">
              <h2>Demo Interaktif! Ayo Coba Sendiri!</h2>
              <p>Sekarang, giliran Anda untuk mencoba kedua metode enkripsi ini. Gunakan alat interaktif di slide berikutnya untuk memahami cara kerjanya secara langsung.</p>
              <h3>Petunjuk Penggunaan:</h3>
              <ol>
                <li><strong>Pilih Metode:</strong> Pilih antara <code>Caesar Cipher</code> untuk melihat versi sederhana, atau <code>AES-GCM</code> untuk versi modern yang aman.</li>
                <li><strong>Isi Plaintext:</strong> Ketik pesan yang ingin Anda enkripsi di kolom "Teks Asli".</li>
                <li><strong>Atur Kunci:</strong>
                  <ul>
                    <li>Untuk <strong>Caesar</strong>, tentukan angka pergeseran (Shift).</li>
                    <li>Untuk <strong>AES</strong>, buat password yang kuat.</li>
                  </ul>
                </li>
                <li><strong>Enkripsi:</strong> Klik tombol <strong>"🔐 Enkripsi"</strong>. Lihat hasilnya di kolom "Teks Terenkripsi" dan "Hasil Enkripsi".</li>
                <li><strong>Dekripsi:</strong> Salin teks terenkripsi, tempel di kolom "Teks Terenkripsi", pastikan kunci sama, lalu klik <strong>"🔓 Dekripsi"</strong>. Pesan asli Anda akan muncul kembali!</li>
              </ol>
              <div className="alert alert-info mt-6">
                <span>Klik tombol "Selanjutnya" untuk membuka alat demo.</span>
              </div>
            </div>
          )}

          {/* Slide 6: The Tool */}
          {currentSlide === 5 && <EncryptionTool />}

          {/* Slide 7: Comparison */}
          {currentSlide === 6 && (
            <div className="prose prose-lg max-w-none">
              <h2>Perbandingan Caesar vs. AES-GCM</h2>
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Aspek</th>
                      <th>Caesar Cipher</th>
                      <th>AES-GCM</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td><strong>Keamanan</strong></td><td>Rendah (sangat mudah dipecahkan)</td><td>Sangat Tinggi (standar industri)</td></tr>
                    <tr><td><strong>Kompleksitas</strong></td><td>Sangat Sederhana</td><td>Sangat Kompleks (matematika intensif)</td></tr>
                    <tr><td><strong>Kunci</strong></td><td>Angka (shift)</td><td>String (password yang di-hash)</td></tr>
                    <tr><td><strong>Integritas Data</strong></td><td>Tidak ada</td><td>Ya (melalui mode GCM)</td></tr>
                    <tr><td><strong>Kasus Penggunaan</strong></td><td>Edukasi, teka-teki sederhana</td><td>HTTPS, VPN, enkripsi file/disk, keamanan aplikasi</td></tr>
                    <tr><td><strong>Performa</strong></td><td>Sangat Cepat</td><td>Cepat (dioptimalkan di hardware modern)</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Slide 8: Conclusion */}
          {currentSlide === 7 && (
            <div className="prose prose-lg max-w-none">
              <h2>Kesimpulan</h2>
              <ul>
                <li><strong>Enkripsi adalah fondasi keamanan digital.</strong> Ini adalah alat penting untuk melindungi privasi dan data sensitif kita.</li>
                <li><strong>Pilih metode enkripsi yang tepat sesuai kebutuhan.</strong>
                  <ul>
                    <li><strong>Caesar Cipher</strong> adalah titik awal yang bagus untuk memahami konsep dasar pergeseran dan kunci.</li>
                    <li><strong>AES-GCM</strong> adalah pilihan yang harus digunakan untuk melindungi data nyata di dunia produksi.</li>
                  </ul>
                </li>
                <li><strong>Kunci adalah rahasia utama.</strong> Keamanan enkripsi bergantung pada kerahasiaan dan kekuatan kunci. Jaga password Anda dengan baik!</li>
              </ul>
              <div className="text-center mt-8">
                <h3 className="text-2xl font-bold">Terima kasih!</h3>
                <p className="text-lg">Selalu jaga kerahasiaan data Anda!</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8">
            <button className="btn btn-outline" onClick={prevSlide} disabled={currentSlide === 0}>← Sebelumnya</button>
            <span className="text-sm opacity-70">Slide {currentSlide + 1} dari {totalSlides}</span>
            <button className="btn btn-primary" onClick={nextSlide} disabled={currentSlide === totalSlides - 1}>Selanjutnya →</button>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-xs opacity-60 text-center">
          Dibuat dengan Next.js • Tailwind • daisyUI — AES-GCM via Web Crypto API
        </footer>
      </main>

      {/* Style untuk memperbaiki warna teks di mode gelap */}
      <style jsx>{`
        /* Menggunakan variabel CSS dari daisyUI untuk warna teks di kelas 'prose' */
        html[data-theme='dark'] .prose {
          --tw-prose-body: hsl(var(--bc)); /* Warna teks utama */
          --tw-prose-headings: hsl(var(--bc)); /* Warna judul (h1, h2, dll.) */
          --tw-prose-lead: hsl(var(--bc)); /* Warna teks pendahuluan */
          --tw-prose-links: hsl(var(--pc)); /* Warna link */
          --tw-prose-bold: hsl(var(--bc)); /* Warna teks tebal */
          --tw-prose-counters: hsl(var(--bc)); /* Warna counter di daftar */
          --tw-prose-bullets: hsl(var(--bc)); /* Warna bullet di daftar */
          --tw-prose-hr: hsl(var(--b2)); /* Warna garis horizontal */
          --tw-prose-quotes: hsl(var(--bc)); /* Warna kutipan */
          --tw-prose-quote-borders: hsl(var(--b3)); /* Warna border kutipan */
          --tw-prose-captions: hsl(var(--bc)); /* Warna caption gambar/tabel */
          --tw-prose-code: hsl(var(--bc)); /* Warna kode inline */
          --tw-prose-pre-code: hsl(var(--bc)); /* Warna kode di dalam blok pre */
          --tw-prose-pre-bg: hsl(var(--b2)); /* Warna background blok kode */
          --tw-prose-th-borders: hsl(var(--b2)); /* Warna border header tabel */
          --tw-prose-td-borders: hsl(var(--b2)); /* Warna border sel tabel */
        }
      `}</style>
    </div>
  );
}