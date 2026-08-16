# Spesifikasi ADN (v1)

> **"Markup is for Screens. Markdown is for Docs. ADN is for Intelligence."**

## Ringkasan
**ADN (Agent Data Notation)** adalah format serialisasi AI-native yang sangat efisien yang dirancang untuk Large Language Models. Format ini merepresentasikan data dalam ruang laten multi-dimensi, yang dioptimalkan untuk atensi AI ketimbang hierarki visual manusia.

### Klasifikasi Representasi: Human IR vs. Agent IR
Melalui desain kolaboratif dan penyempurnaan filosofis, sistem representasi logika pemrograman dan notasi data diklasifikasikan ke dalam dua kategori utama berdasarkan bagaimana batasan struktural didefinisikan:

1. **Human IR (Human Intermediate Representation / Interface Representation)**:
   - **Karakteristik Utama**: Mengandalkan **visual block delimiters** (seperti kurung kurawal, kurung siku, koma, indentasi, dan kutipan bersarang) untuk menyusun hierarki data.
   - **Tujuan**: Dioptimalkan agar mata manusia dapat mengenali batasan (*scope*) dan kedalaman bersarang (*nesting*) secara visual.
   - **Batas AI-Native**: Meskipun format ramah-AI menggunakan kata-kata manusia (yang sebenarnya sangat *native* bagi LLM), penulisannya masih terikat pada paradigma **Human IR** karena masih mengandalkan visual block delimiters.
   - **Kelemahan bagi AI**: Memaksa AI melakukan parsing pada kurung penutup yang bersarang, memicu overhead token yang besar pada sintaksis visual buatan, serta rawan terhadap kegagalan penafsiran hierarki yang mendalam.

2. **Agent IR (Agent Intermediate Representation / Interface Representation)**:
   - **Karakteristik Utama**: Membuang seluruh batas visual berpasangan dan menggantinya dengan sistem **perataan relasional datar (flat relational referencing)** menggunakan penanda struktural 1-token (seperti `·`, `¤`, `§`, `※`).
   - **Tujuan**: Mengizinkan kata-kata manusia (yang merupakan bahasa asli LLM) mengalir bebas tanpa sekat visual buatan. Struktur data diratakan secara non-linier dan langsung dipetakan ke dalam ruang atensi serta latent space AI secara ekstrem dan hemat token.

| Kategori (IR) | Batasan Struktural | Tingkat Antarmuka | Target Penerima |
| :--- | :--- | :--- | :--- |
| **Human IR** | Blok Visual (kurung, koma) | **User Interface (UI)** | Mata Manusia |
| **Human IR** | Teks Linier & Blok Visual | **Developer Interface (DX)** | Logika Manusia |
| **Agent IR** | Referensi Relasional Datar (`≡`, `※`, `¤`) + Penanda Struktural (`░`, `§`, `→`, `¦`) | **Agent Interface (AX)** | **Atensi AI (Latent)** |

## 1. Penanda Struktural (Structural Markers)

| Peran | Karakter | Nama Unicode | Deskripsi |
| :--- | :---: | :--- | :--- |
| **Value Marker** | `·` | U+00B7 (MIDDLE DOT) | Portal untuk mendefinisikan string ter-intern di dalam intern pool. |
| **Grid Marker** | `░` | U+2591 (LIGHT SHADE) | Menandai awal dari sebuah Grid block. |
| **Column Marker** | `§` | U+00A7 (SECTION SIGN) | Menandai bagian tajuk/kolom di dalam sebuah Grid. |
| **Title Marker** | `†` | U+2020 (DAGGER) | Menandai sebuah judul. |
| **Row Marker** | `→` | U+2192 (RIGHTWARDS ARROW) | Menandai awal dari sebuah item Set, properti Map, atau baris Grid. |
| **Row Separator** | `¦` | U+00A6 (BROKEN BAR) | Memisahkan sel data di dalam satu baris Grid. |
| **Relation Binder** | `≡` | U+2261 (IDENTICAL TO) | Mengikat kunci (*key*) ke nilai (*value*) pada properti Map. |
| **Value Ref** | `¤` | U+00A4 (CURRENCY SIGN) | Portal ke sebuah string ter-intern di dalam intern pool (berdasarkan Indeks). |
| **Grid Ref** | `※` | U+203B (REFERENCE MARK) | Portal ke blok data yang telah didefinisikan sebelumnya (berdasarkan Indeks). |
| **True** | `◆` | U+25C6 (BLACK DIAMOND) | Nilai boolean true. |
| **False** | `◇` | U+25C7 (WHITE DIAMOND) | Nilai boolean false. |
| **Null** | `○` | U+25CB (WHITE CIRCLE) | Nilai null / kosong. |

---

## 2. Mekanika Notasi
ADN dilengkapi fitur-fitur mutakhir yang dirancang untuk efisiensi data ekstrem serta konektivitas non-linear:
- **List / Set**: Grid anonim dengan 1 kolom.
- **Meta / Map**: Grid anonim dengan 2 kolom yang diikat menggunakan Relation Binder `≡`.
- **Value Referencing (`¤`)**: Penunjuk referensi ke intern pool terpusat untuk menghindari duplikasi string.
- **Grid Referencing (`※`)**: Penunjuk referensi ke blok data yang sudah didefinisikan sebelumnya untuk memfasilitasi penggunaan ulang struktur data.
- **Interning**: Proses memindahkan string literal berulang ke dalam intern pool terpusat guna menghemat token.

### 2.1 Payload & Aturan Struktural
- **Pure ADN**: Payload ADN tidak memiliki batasan seperti bracket atau marker envelope. Payload terdiri dari intern pool opsional yang diikuti satu atau lebih blok data.
- **Intern Pool**: Intern pool adalah blok string yang diawali `·`. Bersifat opsional — hanya ada jika data mengandung Value Reference (`¤`). Secara default (Intern-Last), intern pool diletakkan di akhir blok payload (setelah `░`), memungkinkan atensi LLM untuk fokus pada skema struktural terlebih dahulu. Dekoder mendukung intern pool yang berada di depan (Intern-First) maupun di belakang (Intern-Last) secara transparan.

### 2.2 Grid
- **Kebutuhan Grid**: Payload ADN yang valid harus mengandung setidaknya satu grid (`░`).
- **Multi-Grid Capability**: Satu payload ADN dapat memuat **beberapa** blok Grid (`░`), memungkinkan penyusunan data kompleks yang terdiri dari berbagai set/grid berbeda.
- **Judul Terikat (*Bound Title*)**: Grid BOLEH membawa judul terikat secara inline di antara `░` dan `§`. Judul terikat adalah **satu** label. Jika tajuk kolom (`§`) ada, penanda `†` bersifat implisit di posisi judul (contoh: `░User§name¦role`). Jika judul terikat ada TANPA tajuk kolom, penanda `†` **WAJIB** digunakan untuk membedakan judul dari nilai (contoh: `░†User→hyuze¦admin`).
- **Grid Anonim (*Anonymous Grid*)**: Grid tanpa judul terikat maupun tajuk kolom disebut grid anonim (contoh: `░hyuze¦admin→alice¦dev`). Pada grid anonim, Row Marker (`→`) pada baris **pertama** bersifat **OPSIONAL**. Grid anonim umumnya merepresentasikan daftar atau himpunan homogen di mana bentuk baris dipahami dari konteks. Seluruh baris berikutnya tetap membutuhkan Row Marker.
- **Auto Grid Indexing**: Setiap blok Grid (`░`) di dalam payload diberikan indeks urutan mulai dari `0` secara atas-bawah (top-down / parent-first). Grid 0 adalah grid induk terluar (root). Karena indeks 0 merupakan grid induk itu sendiri, penunjuk referensi grid (`※`) untuk struktur bersarang (nested) selalu dimulai dari `※1`.
- **Empty Collections**: Set kosong adalah `░`. Map kosong adalah `░≡`.
- **Nilai Skalar**: Nilai skalar (`◆`, `◇`, `○`) adalah nilai sel di dalam baris Grid. Tidak muncul di luar Grid.
- **Penghilangan Separator Trailing**: Separator `¦` trailing BOLEH tidak ada ketika sel-sel terakhir di akhir baris kosong. Sel trailing yang hilang diperlakukan sebagai string kosong.
- **Unresolvable Referencing**: Referensi grid atau value tidak dapat diselesaikan dalam kasus-kasus berikut. Seluruh referensi yang tidak dapat diselesaikan menghasilkan `null`.
  - **Di luar jangkauan**: Indeks melebihi jumlah grid yang didefinisikan (contoh: `※99` ketika hanya ada 3 grid).
  - **Dependensi melingkar**: Grid 0 merujuk ke dirinya sendiri (`※0`). Karena indeks 0 adalah root, referensi diri sendiri selalu menghasilkan `null` untuk mencegah loop tak terbatas.
  - **Referensi malformed**: `※` diikuti karakter non-digit (contoh: `※abc`, `※-1`, atau `※` tanpa angka). `parseInt` mengembalikan `NaN` atau indeks negatif, keduanya menghasilkan `null`.
  - **Grid undefined**: Indeks menunjuk ke grid yang tidak pernah didefinisikan dalam payload (contoh: `※5` ketika grid 0–2 ada).



---

## 3. Analisis Biaya Token

Semua penanda struktural dioptimalkan untuk biaya **1 token** pada model target utama (OpenAI, Claude, Grok/xAI). Beberapa model Cina (GLM, Qwen, Hy3, Kimi, Nex) mungkin menokenisasi beberapa penanda dengan +2 karena perbedaan data pelatihan tokenizer; kami terus berusaha mencapai biaya +1 universal di semua model.

### 3.1 Matriks Biaya Penanda

| Char | Peran | MiMo | DeepSeek | Grok | GLM-5.1 | Qwen3.6 | Hy3 | Kimi-K2.6 | Nex-N2 |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `·` | Value | +1 | +1 | +1 | +1 | +1 | +1 | +1 | +1 |
| `░` | Grid | +1 | +1 | +1 | +1 | +1 | +2 | +1 | +1 |
| `§` | Kolom | +1 | +1 | +1 | +1 | +1 | +1 | +1 | +1 |
| `†` | Judul | +1 | +1 | +1 | +1 | +1 | +1 | +1 | +1 |
| `→` | Baris | +1 | +1 | +1 | +1 | +2 | +1 | +2 | +2 |
| `¦` | Pemisah Baris | +1 | +1 | +1 | +1 | +1 | +1 | +1 | +1 |
| `≡` | Binder | +1 | +1 | +1 | +1 | +1 | +1 | +1 | +1 |
| `¤` | Value Ref | +1 | +1 | +1 | +1 | +1 | +1 | +1 | +1 |
| `※` | Grid Ref | +1 | +1 | +1 | +1 | +1 | +1 | +1 | +1 |
| `◆` | True | +1 | +1 | +1 | +1 | +1 | +1 | +2 | +1 |
| `◇` | False | +1 | +1 | +1 | +1 | +1 | +1 | +1 | +1 |
| `○` | Null | +1 | +1 | +1 | +1 | +1 | +1 | +1 | +1 |
| `ε` | Payload Terminator | +1 | TBD | TBD | TBD | TBD | TBD | TBD | TBD |

### 3.2 Metodologi

- **Pendekatan baseline**: Setiap karakter penanda didepankan ke string tetap `"char hyuze"`. Hitungan token baseline dari `"char hyuze"` saja dikurangkan untuk mengisolasi biaya penanda.
- **System prompt**: Provider berbasis API (MiMo, SiliconFlow, OpenAI, Claude) **tidak menggunakan system prompt** — hanya satu pesan user yang dikirim. xAI/Grok menggunakan system prompt `"Respond with only: ok"` untuk menstabilkan output agar ekstraksi metrik konsisten.
- **MiMo**: Diuji via MiMo API (`mimo-v2.5`).
- **DeepSeek**: Diuji via SiliconFlow API (`deepseek-ai/DeepSeek-V3`).
- **Grok**: Diuji via xAI web console (otomasi puppeteer, `console.x.ai`).
- **Model Cina**: Diuji via SiliconFlow API (GLM-5.1, Qwen3.6-35B-A3B, Hy3-preview, Kimi-K2.6, Nex-N2-Pro).

*Spesifikasi Resmi ADN - Diperbarui 14 Juli 2026*
