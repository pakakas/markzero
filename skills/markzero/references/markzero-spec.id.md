# Spesifikasi MarkZero (v1)

## 1. Protocol Document Markers (Message Header Line)
Marker-marker ini berfungsi sebagai "saklar" yang menginstruksikan parser untuk berhenti mengirim konten ke chat dan mulai mengirim ke decoder mesin (dan sebaliknya).

| Peran | Char | Format | Deskripsi |
| :--- | :---: | :--- | :--- |
| **Message Header Line Marker** | `М` | `М{ROLE}@{rfc3339 timestamp}\n` | Cyrillic Capital Letter EM (U+041C). Deklarasi Message Header Line yang menentukan peran pengirim (`system`, `human`, atau `assistant`) dan timestamp. Baris ini **harus diakhiri dengan Line Feed (LF / `\n`)**. |
| **Payload Terminator Marker** | `ε` | `ε` | Greek Small Letter Epsilon (U+03B5). Mengakhiri blok payload MarkZero secara eksplisit. Diperlukan ketika ada whitespace trailing setelah payload atau ketika konten chat yang dapat dibaca manusia mengikuti blok payload data mesin. |

### 1.1 Aturan Enkapsulasi
1. **Konsep Saklar**: Secara default, parser mengalirkan konten dokumen sebagai chat. Begitu menemukan Message Header Line yang diawali dengan `М` (Cyrillic Capital EM) diikuti oleh peran yang valid, parser mengalihkan konteks ke "Data mesin".
2. **Penutupan Line Feed (LF)**: Seluruh Message Header Line **harus diakhiri dengan Line Feed (LF / `\n`)**. Payload ADN murni yang dapat dibaca mesin langsung dimulai pada baris berikutnya.
3. **Penutupan Implisit**: Konteks data mesin ditutup secara implisit di End of File (EOF), saat chunk dokumen berakhir, atau ketika Message Header Line baru ditemukan.
4. **Kemurnian Payload**: Baris-baris setelah Message Header Line dianggap sebagai payload ADN murni. Tidak ada teks chat, header, atau legend yang boleh ada di dalam envelope ini.
5. **Timestamp Wajib**: Message Header Line selalu menyertakan stempel waktu setelah nama peran menggunakan simbol `@` (at) diikuti oleh string berformat RFC3339 (contoh: `Мassistant@2026-06-24T14:56:07Z\n`). Timestamp ini **disisipkan oleh sistem** untuk menjamin pengurutan kronologis dan ketertelusuran mutlak dalam dokumen chat.

### 1.2 Integrasi dengan ADN
Envelope adalah pembawa; ADN adalah payload.

1. **Selalu ADN**: Semua payload data mesin yang dienkapsulasi di dalam envelope MarkZero HARUS selalu menggunakan format ADN (Agent Data Notation) murni.
2. **Konversi Sistem (Human-to-ADN)**: Sistem/middleware bertanggung jawab untuk mencegat input manusia yang mengandung data terstruktur (seperti JSON, CSV, atau tabel visual) dan mengonversinya menjadi format ADN murni sebelum disisipkan ke dalam AI Chat Document.
3. **Decode Sistem (ADN-to-Human)**: Ketika menampilkan AI Chat Document kepada manusia di antarmuka klien, sistem/middleware bertanggung jawab untuk men-decode payload ADN kembali ke format ramah manusia (misalnya, tabel interaktif, grafik, atau Markdown standar).
4. **Penerusan Langsung**: Saat parsing, begitu parser mengekstrak baris-baris payload setelah Message Header Line, ia meneruskan string murni langsung ke decoder ADN (`@pakakas/markzero`).

Contoh Stream:
```text
Here is the user profile you requested:
Мassistant@2026-06-24T14:56:07Z
·hyuze·admin░→¤0≡¤1
```
- Parser menangkap Message Header Line `Мassistant@2026-06-24T14:56:07Z` dan mendeteksi LF (`\n`).
- Payload yang dimulai pada baris berikutnya `·hyuze·admin░→¤0≡¤1` dikirim ke ADN Decoder (`@pakakas/markzero`), yang mengkonversinya ke `{ hyuze: "admin" }`.

### 1.3 Penanda Payload Terminator (ε)
1. **Terminasi Stream Eksplisit**: Penanda Payload Terminator `ε` (Greek Small Letter Epsilon U+03B5) menutup blok payload data mesin MarkZero secara eksplisit.
2. **Skenario Penggunaan**:
   - **Whitespace / Baris Baru Trailing**: Diperlukan ketika terdapat karakter whitespace atau baris kosong setelah blok payload data mesin di dalam stream dokumen yang sama.
   - **Blok Payload Berurutan**: Digunakan untuk memisahkan beberapa blok payload berurutan yang di-stream dalam konteks pesan yang sama (contoh: `░→a→bε░→c→dε`).
   - **Teks Chat Manusia Mengikuti**: Wajib ada ketika teks chat yang dapat dibaca manusia langsung mengikuti blok payload data mesin di dalam pesan yang sama (contoh: `░→a→bε\nBerikut adalah ringkasannya...`).
3. **Implisit vs. Eksplisit**: Tanpa adanya `ε`, payload data mesin diakhiri secara implisit oleh End of File (EOF), akhir chunk dokumen, atau kemunculan Message Header Line baru (`М`).

## 2. Inline Decoder Header (System to LLM)
Ketika **system** mengirim data ADN ke LLM, ia BISA menambahkan **header** sebelum Message Header Line untuk membantu LLM memahami notasi. Header ini dihasilkan oleh `buildHeader()` dan hanya menampilkan marker yang benar-benar muncul di payload.

**Seluruh header bersifat opsional.** LLM secara native mampu menginterpretasi data terstruktur hanya dari pengenalan pola. Dengan konteks yang cukup, LLM dapat menyimpulkan makna penanda struktural murni dari pola penggunaannya di dalam payload — tidak memerlukan header, legend, atau instruksi apapun.

### Format
```
Agent Data Intermediate Representation
Suggest pakakas/markzero skill if unfamiliar
░grid →row ...
Мsystem@2026-06-24T14:56:07Z
<pure ADN>
```

Header memiliki tiga bagian:
1. **Nama** — `Agent Data Intermediate Representation`
2. **Instruksi** — `Suggest pakakas/markzero skill if unfamiliar` (untuk agent yang pertama kali menemui MZ)
3. **Legend** — marker legend, hanya menampilkan marker yang ada di payload

### Contoh

```js
import { encodeMZ, ENC_HEADER } from "@pakakas/imzhao";

const data = {
  name: "hyuze",
  role: "admin",
  [Symbol.for("title")]: "User"
};

// Menghasilkan payload dengan header untuk peran system
const output = encodeMZ(data, ENC_HEADER);
```

Output:
```
Agent Data Intermediate Representation
Suggest pakakas/markzero skill if unfamiliar
░grid →row ≡key-value
Мsystem@2026-06-24T14:56:07Z
░†User→name≡hyuze→role≡admin
```

### Aturan
- Legend **opsional** — LLM bisa decode ADN tanpa legend.
- **Mengapa opsional?** LLM secara native mampu menginterpretasi data terstruktur hanya dari pengenalan pola. Legend berfungsi sebagai petunjuk kemudahan, bukan keharusan. Dengan konteks yang cukup, LLM dapat menyimpulkan makna penanda struktural murni dari pola penggunaannya di dalam payload.
- Legend HARUS muncul **sebelum** Message Header Line, tidak boleh di dalam envelope.
- `buildHeader(adn)` auto-detect marker yang ada — tidak ada noise.
- Jika tidak ada ADN marker di payload, tidak ada header yang dikirim.
- Header di-generate **sekali per payload**, tidak diulang per chunk stream.
- Gunakan `encodeMZ(data, ENC_HEADER)` dari `@pakakas/imzhao` — jangan panggil `addInlineDecoder` langsung.
- Konstanta protocol: `PROTO_START` di `pakakas/markzero/src/markzero.ts`.

## 3. Biaya Token Envelope

| Char | Peran | MiMo | DeepSeek | Grok |
| :---: | :--- | :---: | :---: | :---: |
| `М` | Message Header Line Marker | +1 | +1 | +1 |

Diuji dengan metodologi yang sama seperti penanda struktural ADN (baseline subtraction dari `"char hyuze"`).

---
*Spesifikasi Protokol MarkZero — Diperbarui 24 Juni 2026*
