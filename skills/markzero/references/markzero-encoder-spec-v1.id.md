# Spesifikasi Optimasi Encoder & Perataan Data Relasional MarkZero (v1)

## Ringkasan
Jika **Spesifikasi MarkZero** mengatur struktur payload dan aturan decoding, **Spesifikasi Encoder** mengatur strategi dan algoritma yang digunakan untuk menerjemahkan struktur data runtime yang kompleks dan bersarang menjadi payload MarkZero yang sangat terkompresi dan hemat token.

Tujuan utama encoder adalah memaksimalkan **Efisiensi Perhatian (Attention Efficiency)** LLM dengan cara:
1. **Perataan Data Relasional (Relational Data-Flattening)**: Mengonversi struktur bersarang yang hierarkis menjadi aliran blok grid independen yang saling mereferensikan.
2. **Interning Matematis (Mathematical Interning)**: Menggunakan heuristik biaya untuk memutuskan literal berulang mana saja yang layak dimasukkan ke Token Pool.

---

## 1. Perataan Data Relasional (Post-Order Multi-Grid Serialization)
Struktur JSON yang sangat bersarang dan seperti pohon memberikan beban kognitif tinggi bagi LLM karena overhead sintaksis (kurung kurawal, kurung siku, koma, kutipan ter-escape). Encoder MarkZero menyelesaikan hal ini dengan meratakan objek dan array bersarang dari bawah ke atas (penelusuran *post-order*) menjadi aliran blok grid yang datar, lalu mereferensikannya melalui Referensi Grid (`※index`).

### 1.1 Aturan Penelusuran & Pengindeksan
1. **Penelusuran Post-Order / Bottom-Up**: Encoder menelusuri struktur bersarang secara *depth-first*. Objek atau array anak yang bersarang diserialisasi *sebelum* induknya.
2. **Pendorongan Blok Berurutan**: Setiap grid anak yang telah diserialisasi didorong ke daftar payload pusat (`blocks`). Objek induk mereferensikan anak tersebut menggunakan `※index`, di mana `index` sesuai dengan posisi anak dalam daftar `blocks`.
3. **Pengindeksan Grid Implisit**: Decoder merekonstruksi referensi secara berurutan. Setiap Penanda Grid (`ⓖ`) yang ditemukan dalam payload transmisi akan menaikkan indeks grid otomatis, mencocokkan urutan *post-order*.
4. **Deduplikasi Grid / Grid Interning**: Untuk memaksimalkan efisiensi token, encoder dapat melakukan deduplikasi pada struktur bersarang yang identik. Ketika menserialisasi entri anak bersarang, encoder memeriksa apakah grid ter-serialisasi yang identik (memiliki kunci dan nilai yang sama) sudah ada di dalam daftar `blocks` pusat. Jika kecocokan ditemukan, encoder menggunakan kembali referensi indeks grid yang sudah ada (`※index`) daripada mendorong blok duplikat baru. Hal ini memungkinkan beberapa kunci induk untuk berbagi blok grid yang sama, mengurangi ukuran payload secara drastis dengan tetap menjaga kompatibilitas decoder yang sempurna.

---

## 2. Klasifikasi Koleksi & Aturan Pelestarian Grid
Untuk menjaga batas logis data (seperti data tabular atau grid homogen), encoder mengklasifikasikan array sebelum meratakannya.

### 2.1 Klasifikasi Koleksi
- **Grid Homogen (Array of Objects / DoD)**: Array di mana setiap elemennya berupa objek biasa tanpa judul (contoh: `[{name: "a"}, {name: "b"}]`).
- **Matriks 2D**: Array di mana setiap elemennya berupa array (contoh: `[["1", "0"], ["0", "1"]]`).
- **Array Heterogen**: Array yang berisi tipe campuran atau objek/array bersarang (contoh: `[{title: "Header"}, [1, 2]]`).

### 2.2 Logika Pelestarian & Pemecahan Grid
Ketika encoder memproses array `input` pada tingkat apa pun:
1. **Early Return untuk Non-Array**: Jika `input` bukan berupa array, serialisasikan langsung sebagai satu blok tunggal.
2. **Lestarikan Grid Homogen (DoD)**: Jika `isUniformGrid(input)` bernilai true, jangan pecah array tersebut. Array diserialisasi sebagai grid ber-header kolom tunggal (`ⓖᴄ...`).
3. **Lestarikan Matriks 2D**: Jika `is2DMatrix(input)` bernilai true, jangan pecah array tersebut. Array diserialisasi sebagai grid matriks 2D tunggal.
4. **Pecah Array Heterogen**: Jika `input.some(isNestedStructure)` bernilai true, array tersebut bersifat heterogen dan mengandung struktur bersarang. Dalam hal ini, array akan dipecah: encoder memetakan isi array, melakukan serialisasi rekursif pada setiap item, dan mengembalikan aliran blok gabungan.

---

## 3. Token Pool & Heuristik Profitabilitas
Interning nilai (Token Pooling) menggantikan literal string yang berulang dengan penunjuk referensi (`¤index`) yang merujuk ke Token Pool (`·`) di awal payload. Proses interning membawa overhead definisi, sehingga encoder menggunakan rumus profitabilitas untuk membuat keputusan yang optimal.

### 3.1 Rumus Profitabilitas
Kandidat string hanya akan dimasukkan ke pool jika total penghematan token melebihi biaya overhead untuk mendefinisikannya di dalam pool:

$$\text{frekuensi} \times (\text{tokenLength} - \text{refCost}) > (\text{poolOverhead} + \text{tokenLength})$$

- **frekuensi**: Jumlah total kemunculan kandidat string dalam payload (baik di kunci maupun nilai).
- **tokenLength**: Estimasi ukuran token dari string asli.
- **refCost**: Biaya token dari penunjuk referensi (`¤index`), diasumsikan sebesar **2 token** (1 untuk `¤`, 1 untuk indeks).
- **poolOverhead**: Biaya token untuk mendefinisikan entri pool baru (`·`), diasumsikan sebesar **1 token**.

### 3.2 Heuristik Estimasi Ukuran Token
Untuk menghindari regex yang mahal atau sub-tokenizer yang berat, encoder menggunakan heuristik pemindaian karakter tanpa alokasi memori (*zero-allocation character scanner*):
- **Simbol**: Karakter tanda baca, spasi, atau simbol Unicode yang berurutan dihitung sebagai **1 token**.
- **Blok Alfanumerik**: Blok huruf atau angka yang berurutan dihitung sebagai **1 token**.
- **Spasi/Newline**: Karakter baris baru atau spasi putih yang berurutan dihitung sebagai **1 token**.

---

## 4. Mode Encoding (Strategi Kompresi)
Encoder umumnya mendukung tiga mode operasional referensi untuk menyeimbangkan rasio kompresi dengan performa runtime eksekusi encoder:

| Mode | Pengidentifikasi | Strategi Interning | Kasus Penggunaan |
| :--- | :--- | :--- | :--- |
| **Default (Literal)** | `MODE_DEFAULT` | **Tanpa pooling**. Semua kunci dan nilai ditulis langsung sebagai literal. Aman untuk payload kecil di mana overhead melebihi penghematan. | Latensi rendah, peta konfigurasi kecil |
| **Nilai Pintar** | `ENC_VALUES` | **Hanya pool nilai data**. Hanya mengevaluasi nilai data terhadap rumus profitabilitas. Kunci dibiarkan sebagai literal. | Log, baris database, telemetri |
| **Pool Semua** | `ENC_INTERN_ALL` | **Pool kunci dan nilai**. Mengevaluasi seluruh kemunculan string (baik kunci maupun nilai) untuk dimasukkan ke pool jika menguntungkan. | Struktur yang sangat berulang, skema API |

---

## 5. Ekstendabilitas & Mode Fleksibel (Flex Mode)
Mode encoding referensi yang didefinisikan dalam spesifikasi ini dirancang sebagai panduan bagi para pengembang. Namun, standar MarkZero tidak mengunci implementasi encoder hanya pada mode-mode ini saja.

1. **Heuristik Kustom**: Pengembang sangat didukung untuk merancang mode kompresi baru yang disesuaikan dengan kebutuhan khusus (misalnya, interning kamus spesifik-domain atau kebijakan agresif untuk menghindari penyarangan).
2. **Mode Ketat (Strict Mode)**: Lingkungan tertentu yang mengutamakan keamanan tinggi atau kompleksitas rendah dapat memilih untuk memaksakan kebijakan ketat "Tanpa Interning" (sama dengan `MODE_DEFAULT`) untuk memastikan payload sepenuhnya literal dan menghilangkan seluruh overhead pemrosesan referensi.
3. **Evolusi Netral-Decoder**: Karena semua strategi kompresi memancarkan elemen struktural standar (Token Pool, Referensi Nilai, dan Referensi Grid), setiap mode encoding kustom atau masa depan akan tetap sepenuhnya kompatibel ke belakang (*backward compatible*) dan ke depan (*forward compatible*). Decoder MarkZero v1 standar akan selalu dapat mendekodenya dengan sempurna tanpa memerlukan pembaruan.

---
*Spesifikasi Resmi Encoder MarkZero - Minggu, 31 Mei 2026*
