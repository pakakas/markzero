# Spesifikasi Optimasi Encoder & Perataan Data Relasional ADN (v1)

## Ringkasan
**Spesifikasi Encoder** mengatur strategi dan algoritma yang digunakan untuk menerjemahkan struktur data runtime yang kompleks dan bersarang menjadi payload ADN yang sangat terkompresi dan hemat token.

Tujuan utama encoder adalah memaksimalkan **Efisiensi Perhatian (Attention Efficiency)** LLM dengan cara:
1. **Perataan Data Relasional (Relational Data-Flattening)**: Mengonversi struktur bersarang yang hierarkis menjadi aliran blok grid independen yang saling mereferensikan.
2. **Interning Matematis (Mathematical Interning)**: Menggunakan heuristik biaya untuk memutuskan literal berulang mana saja yang layak diintern.

---

## 1. Perataan Data Relasional (Pre-Order/Top-Down Multi-Grid Serialization)
Struktur JSON yang sangat bersarang dan seperti pohon memberikan beban kognitif tinggi bagi LLM karena overhead sintaksis (kurung kurawal, kurung siku, koma, kutipan ter-escape). Encoder ADN menyelesaikan hal ini dengan meratakan objek dan array bersarang dari atas ke bawah (penelusuran pre-order / parent-first) menjadi aliran blok grid yang datar, lalu mereferensikannya melalui referensi grid diikuti indeks.

### 1.1 Aturan Penelusuran & Pengindeksan
1. **Penelusuran Pre-Order/Atas-Bawah (Parent-First)**: Encoder menelusuri struktur bersarang secara depth-first. Objek atau array induk di-serialisasi *sebelum* anak-anak bersarang di dalamnya.
2. **Penempatan Blok Sekuensial**: Grid induk ditempatkan ke daftar payload sentral (`blocks`) terlebih dahulu (menempati indeks `0`). Setiap blok grid anak yang bersarang kemudian diproses dan ditempatkan ke daftar secara berurutan (menempati indeks `1`, `2`, dst.). Objek induk mereferensikan anaknya menggunakan referensi grid diikuti indeks, di mana `index` sesuai dengan posisi anak di daftar `blocks`.
3. **Implicit Grid Indexing**: Setiap penanda awal grid yang ditemui dalam payload transmisi meningkatkan indeks grid otomatis secara berurutan. Karena induk utama berada pada indeks `0`, referensi grid (`※`) untuk elemen bersarang selalu dimulai dari `※1`, sehingga encoder tidak pernah menghasilkan rujukan ke `※0`.
4. **Deduplikasi Grid / Interning Grid**: Untuk memaksimalkan efisiensi token, encoder dapat mendeduplikasi struktur bersarang yang identik. Saat meng-serialisasi anak bersarang, encoder memeriksa apakah grid serial yang identik (kunci dan nilai yang sama) sudah ada di daftar `blocks` sentral. Jika ditemukan kecocokan, encoder menggunakan kembali referensi indeks grid yang ada alih-alih menambahkan blok duplikat. Ini memungkinkan beberapa kunci induk berbagi blok grid yang sama, secara drastis mengurangi ukuran payload sambil mempertahankan kompatibilitas decoder yang sempurna.

---

## 2. Klasifikasi Koleksi & Aturan Pelestarian
Untuk mempertahankan batas logis (seperti data tabular atau grid seragam), encoder mengklasifikasikan array sebelum diratakan.

### 2.1 Klasifikasi Koleksi
- **Uniform Grid (Array of Objects / DoD)**: Array di mana setiap elemen adalah objek polos tanpa judul (misalnya, `[{name: "a"}, {name: "b"}]`).
- **Matriks 2D**: Array di mana setiap elemen adalah array (misalnya, `[["1", "0"], ["0", "1"]]`).
- **Array Heterogen**: Array yang berisi tipe campuran atau objek/array bersarang (misalnya, `[{title: "Header"}, [1, 2]]`).

### 2.2 Logika Pelestarian & Pemisahan
Saat encoder memproses array `input` di level berapa pun:
1. **Return Awal untuk Non-Array**: Jika `input` bukan array, serialisasikan sebagai blok tunggal langsung.
2. **Pertahankan Uniform Grid (DoD)**: Jika `isUniformGrid(input)` bernilai true, jangan pecah. Diserialisasi sebagai grid tunggal dengan header kolom.
3. **Pertahankan Matriks 2D**: Jika `is2DMatrix(input)` bernilai true, jangan pecah. Diserialisasi sebagai grid 2D tunggal.
4. **Pisahkan Array Heterogen**: Jika `input.some(isNestedStructure)` bernilai true, array tersebut heterogen dan berisi struktur bersarang. Dalam kasus ini, array dipisahkan: encoder memetakan array, meng-serialisasi setiap item secara rekursif, dan mengembalikan aliran blok yang digabungkan.

---

## 3. Judul Grid
Ketika blok Grid merepresentasikan struktur bernama, encoder BOLEH mengeluarkan judul terikat. Semantik dan penempatan penanda judul terikat didefinisikan dalam **Spesifikasi ADN (§2.2 Judul Terikat)**.

### 3.1 Kapan Mengeluarkan Judul
- **Objek Bertipe**: Ketika meng-serialisasi objek dengan tipe atau nama kelas yang diketahui, gunakan nama tipe sebagai judul terikat.
- **Koleksi Bernama**: Ketika koleksi memiliki nama yang bermakna di data sumber, gunakan sebagai judul terikat.

### 3.2 Kapan Menghilangkan Judul
- **Struktur Anonim**: Ketika grid merepresentasikan objek atau array anonim tanpa nama yang bermakna, hilangkan judul.
- **Konteks Jelas**: Ketika tujuan grid sudah jelas dari header kolom atau posisi di payload, judul menambah token yang tidak perlu.

---

## 4. Aturan Nilai Skalar & Koleksi Kosong
Nilai skalar non-string (`true`, `false`, `null`) ditulis secara inline pada posisi nilai dan **tidak pernah** diintern. Marker skalar (`◆`, `◇`, `○`) selalu menjadi nilai sel di dalam Grid — TIDAK BOLEH muncul sebagai payload yang berdiri sendiri.

### 4.1 Koleksi Kosong
Set (array) kosong diserialisasikan menjadi `░` dan Map (objek) kosong diserialisasikan menjadi `░≡`. Representasi ini hanya untuk penyimpanan dan transportasi. Encoder yang menargetkan konsumsi LLM SEBAIKNYA menghilangkan koleksi kosong, karena tidak menyediakan data yang berguna untuk diproses model.

---

## 5. Heuristik Profitabilitas Interning
Interning nilai menggantikan literal string yang berulang dengan Value Ref diikuti indeks, yang merujuk ke intern pool di awal payload. Proses interning membawa overhead definisi, sehingga encoder menggunakan rumus profitabilitas untuk membuat keputusan yang optimal.

### 5.1 Rumus Profitabilitas
String kandidat hanya di-pool jika total penghematan token melebihi overhead mendefinisikannya di pool:

$$\text{frequency} \times (\text{tokenLength} - \text{refCost}) > (\text{poolOverhead} + \text{tokenLength})$$

- **frequency**: Jumlah total kemunculan string kandidat di payload (baik di kunci maupun nilai).
- **tokenLength**: Perkiraan ukuran token dari string.
- **refCost**: Biaya token Value Ref, diasumsikan **2 token** (1 untuk marker, 1 untuk indeks).
- **poolOverhead**: Biaya token mendefinisikan entri pool, diasumsikan **1 token**.

### 5.2 Heuristik Estimasi Ukuran Token
Untuk menghindari regex mahal atau sub-tokenizer berat, encoder menggunakan heuristik pemindaian karakter tanpa alokasi:
- **Simbol**: Tanda baca berurutan, spasi, atau simbol Unicode mewakili **1 token**.
- **Blok Alfanumerik**: Huruf alfabet berurutan atau digit mewakili **1 token**.
- **Whitespace**: Baris baru berurutan atau whitespace mewakili **1 token**.

### 5.3 Penghilangan Separator Trailing
Saat meng-encode baris grid, encoder menghapus karakter separator baris trailing ketika sel-sel terakhir kosong. Karena header kolom mendefinisikan skema, decoder dapat mengisi sel trailing yang hilang sebagai string kosong.

**Contoh**: Grid 3 kolom (`name`, `parent`, `desc`) di mana `desc` kosong:
- Sebelum: 2 separator
- Sesudah: 1 separator

Ini menghemat **satu token per sel trailing yang dihilangkan** — signifikan ketika banyak baris berbagi pola kolom terakhir kosong yang sama.

---

## 6. Mode Encoding (Strategi Kompresi)
Encoder biasanya mendukung tiga mode operasional referensi untuk menyeimbangkan rasio kompresi dengan performa runtime encoding:

| Mode | Pengidentifikasi | Strategi Interning | Kasus Penggunaan |
| :--- | :--- | :--- | :--- |
| **Default (Literal)** | `MODE_DEFAULT` | **Tanpa pooling**. Semua kunci dan nilai ditulis langsung sebagai literal. Aman untuk payload kecil di mana overhead melebihi penghematan. | Latensi rendah, peta konfigurasi kecil |
| **Smart Values** | `ENC_VALUES` | **Hanya pool nilai**. Hanya memeriksa nilai data terhadap rumus profitabilitas. Kunci dibiarkan sebagai literal. | Log, baris database, telemetri |
| **Intern All** | `ENC_INTERN_ALL` | **Pool kunci dan nilai**. Mengevaluasi semua kemunculan string (kunci dan nilai) untuk profitabilitas. | Struktur sangat berulang, skema API |

> **Rekomendasi**: Saat memilih mode encoding, prioritaskan **keterbacaan LLM**. Kunci eksplisit berfungsi sebagai **jangkar semantik** — memungkinkan LLM memahami struktur dan konteks tanpa harus merujuk ke referensi pool. Pilih mode yang paling menyeimbangkan efisiensi token dengan kejelasan bagi konsumen LLM target.

---

## 7. Ekstensibilitas & Mode Fleksibel (Flex Mode)
Mode encoding referensi yang didefinisikan dalam spesifikasi ini dirancang sebagai panduan bagi para pengembang. Namun, standar ADN tidak mengunci implementasi encoder hanya pada mode-mode ini saja.

1. **Heuristik Kustom**: Pengembang sangat didukung untuk merancang mode kompresi baru yang disesuaikan dengan kebutuhan khusus (misalnya, interning kamus spesifik-domain atau kebijakan agresif untuk menghindari penyarangan).
2. **Mode Ketat (Strict Mode)**: Lingkungan tertentu yang mengutamakan keamanan tinggi atau kompleksitas rendah dapat memilih untuk memaksakan kebijakan ketat "Tanpa Interning" (sama dengan `MODE_DEFAULT`) untuk memastikan payload sepenuhnya literal dan menghilangkan seluruh overhead pemrosesan referensi.
3. **Evolusi Netral-Decoder**: Karena semua strategi kompresi menghasilkan elemen struktural standar (value pool, referensi nilai, dan referensi grid), setiap mode encoding kustom atau masa depan akan tetap sepenuhnya kompatibel ke belakang (*backward compatible*) dan ke depan (*forward compatible*). Decoder ADN v1 standar akan selalu dapat mendekodenya dengan sempurna tanpa memerlukan pembaruan.

---
*Spesifikasi Resmi Encoder ADN - Minggu, 31 Mei 2026*
