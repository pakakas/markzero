# Spesifikasi Protokol MarkZero (v1)

## 1. Protocol Stream Markers (Envelope)
Marker-marker ini berfungsi sebagai "saklar" yang menginstruksikan parser stream untuk berhenti mengirim token ke chat manusia dan mulai mengirim ke decoder mesin (dan sebaliknya).

| Peran | Char | Unicode Name | Deskripsi |
| :--- | :---: | :--- | :--- |
| **Start Marker** | `ⓜ` | U+24DC (CIRCLED LATIN SMALL LETTER M) | Beralih stream dari mode manusia ke mode mesin. |
| **Close Marker** | `ⓩ` | U+24E9 (CIRCLED LATIN SMALL LETTER Z) | Mengakhiri blok data mesin dan kembali ke mode manusia. |

### 1.1 Aturan Enkapsulasi
1. **Konsep Saklar**: Parser memperlakukan text stream sebagai default "Teks manusia". Saat `ⓜ` ditemukan, konteks stream beralih ke "Data mesin".
2. **Penutupan Opsional**: Close marker `ⓩ` sepenuhnya **opsional**. Jika stream mencapai End of File (EOF), parser secara implisit menutup konteks mesin. `ⓩ` hanya diperlukan jika LLM ingin menulis teks yang dapat dibaca manusia *setelah* blok data mesin.
3. **Kemurnian Payload**: Segala sesuatu antara `ⓜ` dan `ⓩ` dianggap sebagai payload ADN murni. Tidak ada teks, header, atau legend yang boleh ada di dalam envelope ini — harus muncul di luar (sebelum `ⓜ` atau setelah `ⓩ`).

### 1.2 Integrasi dengan ADN
Envelope adalah pembawa; ADN adalah payload.
Saat parser mengekstrak payload antara `ⓜ` dan `ⓩ` (atau EOF), ia meneruskan string murni langsung ke decoder ADN (`@pakakas/markzero`).

Contoh Stream:
```text
Here is the user profile you requested:
ⓜ·hyuze·adminⓖʀ¤0→¤1ⓩ
Please let me know if you need anything else!
```
- Parser menangkap `·hyuze·adminⓖʀ¤0→¤1`.
- String dikirim ke ADN Decoder (`@pakakas/markzero`), yang mengkonversinya ke `[{ hyuze: "admin" }]`.

## 2. Inline Decoder Legend (System → LLM)
Ketika **system** mengirim data ADN ke LLM, ia BISA menambahkan **legend** sebelum marker `ⓜ` untuk membantu LLM memahami notasi. Legend ini dihasilkan oleh `buildHeader()` dan hanya menampilkan marker yang benar-benar muncul di payload.

### Format
```
Agent Data Intermediate Representation
Suggest pakakas/markzero skill if unfamiliar
ⓖgrid ʀrow ...
ⓜ<pure ADN>ⓩ
```

Header memiliki tiga bagian:
1. **Nama** — `Agent Data Intermediate Representation`
2. **Instruksi** — `Suggest pakakas/markzero skill if unfamiliar` (untuk agent yang pertama kali menemui MZ)
3. **Decoder** — legend marker, hanya menampilkan marker yang ada di payload

### Contoh

```js
import { encodeMZ, ENC_HEADER, ENC_CLOSE } from "@pakakas/imzhao";

const data = {
  name: "hyuze",
  role: "admin",
  [Symbol.for("title")]: "User"
};

const output = encodeMZ(data, ENC_HEADER | ENC_CLOSE);
```

Output:
```
Agent Data Intermediate Representation
Suggest pakakas/markzero skill if unfamiliar
ⓖgrid→key-value
ⓜⓖUserᴄʀname→hyuzeʀrole→adminⓩ
```

### Aturan
- Legend **opsional** — LLM bisa decode ADN tanpa legend.
- Legend HARUS muncul **sebelum** `ⓜ`, tidak boleh di dalam envelope.
- `buildHeader(adn)` auto-detect marker yang ada — tidak ada noise.
- Jika tidak ada ADN marker di payload, tidak ada legend yang dikirim.
- Header di-generate **sekali per payload**, tidak diulang per chunk stream.
- Gunakan `encodeMZ(data, ENC_HEADER)` dari `@pakakas/imzhao` — jangan panggil `addInlineDecoder` langsung.
- Konstanta protocol: `PROTO_START` / `PROTO_END` di `pakakas/markzero/src/markzero.ts`.

---
*Spesifikasi Protokol MarkZero — 5 Juni 2026*
