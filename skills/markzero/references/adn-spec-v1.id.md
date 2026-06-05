# Spesifikasi MarkZero (v1)

> **"Markup is for Screens. Markdown is for Docs. MarkZero is for Intelligence."**

## Ringkasan
**MarkZero** adalah format serialisasi AI-native yang sangat efisien yang dirancang khusus untuk Large Language Models. Format ini merepresentasikan data dalam ruang laten multi-dimensi, yang dioptimalkan untuk atensi AI ketimbang hierarki visual manusia.

### Klasifikasi Representasi: Human IR vs. Agent IR
Melalui serangkaian diskusi dan perumusan filosofis, sistem representasi logika pemrograman dan notasi data dikelompokkan ke dalam dua kategori utama berdasarkan bagaimana batasan struktural didefinisikan:

1. **Human IR (Human Intermediate Representation / Interface Representation)**:
   - **Karakteristik Utama**: Mengandalkan **visual block delimiters** (seperti kurung kurawal `{ }`, kurung siku `[ ]`, koma, indentasi, dan kutipan bersarang) untuk menyusun hierarki data.
   - **Tujuan**: Dioptimalkan agar mata manusia dapat mengenali batasan (*scope*) dan kedalaman bersarang (*nesting*) secara visual.
   - **Batas AI-Native**: Meskipun format ramah-AI seperti *Zerolang* menggunakan kata-kata manusia (yang sebenarnya sangat *native* bagi LLM), penulisannya masih terikat pada paradigma **Human IR** karena masih mengandalkan struktur blok visual (`{ }`) ala JSON.
   - **Kelemahan bagi AI**: Memaksa AI melakukan parsing pada kurung penutup yang bersarang, memicu overhead token yang besar pada sintaksis visual buatan, serta rawan terhadap kegagalan penafsiran hierarki yang mendalam.

2. **Agent IR (Agent Intermediate Representation / Interface Representation)**:
   - **Karakteristik Utama**: Membuang seluruh batas visual berpasangan (`{ }`) dan menggantinya dengan sistem **perataan relasional datar (flat relational referencing)** menggunakan penanda struktural 1-token (seperti `ⓟ` / `ⓜ`, `·`, `¤`, `ⓖ`, `※`).
   - **Tujuan**: Mengizinkan kata-kata manusia (yang merupakan bahasa asli LLM) mengalir bebas tanpa sekat visual buatan. Struktur data diratakan secara non-linier dan langsung dipetakan ke dalam ruang atensi serta latent space AI secara ekstrem dan hemat token.
   - **MZHAO sebagai Agent IR Sejati**: Protokol **MZHAO** (ditandai dengan trigger `ⓟ`) dirancang murni sebagai Agent IR. Ia mentransmisikan data bantuan (*help messages*) dan instruksi dari alat bantu CLI ke AI Agent dalam bentuk grid datar dan referensi, menghilangkan kurung visual murni dan hanya menyajikan visualisasi tabel kemanusiaan (ASCII) ketika dipanggil secara eksplisit oleh manusia menggunakan bendera `--ascii`.

| Kategori (IR) | Batasan Struktural | Tingkat Antarmuka | Jenis Notasi | Target Penerima |
| :--- | :--- | :--- | :--- | :--- |
| **Human IR** | Blok Visual (`{ }`, `[ ]`, koma) | **User Interface (UI)** | **Mark-UP** | Mata Manusia |
| **Human IR** | Teks Linier & Blok Visual | **Developer Interface (DX)** | **Mark-DOWN** / *Zerolang* | Logika Manusia |
| **Agent IR** | Referensi Relasional Datar (`※`, `¤`) | **Agent Interface (AX)** | **MarkZero / MZHAO** | **Atensi AI (Latent)** |

## 1. Penanda Struktural (Structural Markers)

| Peran | Karakter | Nama Unicode | Deskripsi |
| :--- | :---: | :--- | :--- |
| **Value Marker** | `·` | U+00B7 (MIDDLE DOT) | Portal untuk mendefinisikan string ter-intern di dalam Token Pool. |
| **Grid Marker** | `ⓖ` | U+24D6 (CIRCLED LATIN SMALL LETTER G) | Menandai awal dari sebuah Grid block. |
| **Column Marker** | `ᴄ` | U+1D04 (LATIN LETTER SMALL CAPITAL C) | Menandai bagian tajuk/kolom di dalam sebuah Grid. |
| **Row Marker** | `ʀ` | U+0280 (LATIN LETTER SMALL CAPITAL R) | Menandai awal dari sebuah item Set, properti Map, atau baris Grid. |
| **Row Separator** | `¦` | U+00A6 (BROKEN BAR) | Memisahkan sel data di dalam satu baris Grid. Trailing `¦` untuk sel terakhir yang kosong boleh dihilangkan — decoder mengisi sel yang hilang dengan `""`. |
| **Relation Binder** | `→` | U+2192 (RIGHTWARDS ARROW) | Mengikat kunci (*key*) ke nilai (*value*) pada properti Map. |
| **Value Ref** | `¤` | U+00A4 (CURRENCY SIGN) | Portal ke sebuah string ter-intern di dalam Token Pool (berdasarkan Indeks). |
| **Grid Ref** | `※` | U+203B (REFERENCE MARK) | Portal ke blok data yang telah didefinisikan sebelumnya (berdasarkan Indeks). |
| **Escaper** | `ɛ` | U+025B (LATIN SMALL LETTER OPEN E) | Digunakan untuk meng-escape penanda struktural di dalam konten literal. |

---

## 2. Mekanika Notasi
MarkZero dilengkapi fitur-fitur mutakhir yang dirancang untuk efisiensi data ekstrem serta konektivitas non-linear:
- **List / Set**: Grid anonim dengan 1 kolom.
- **Meta / Map**: Grid anonim dengan 2 kolom yang diikat menggunakan Relation Binder `→`.
- **Value Referencing (`¤`)**: Penunjuk referensi ke Token Pool terpusat untuk menghindari duplikasi string.
- **Grid Referencing (`※`)**: Penunjuk referensi ke blok data yang sudah didefinisikan sebelumnya untuk memfasilitasi penggunaan ulang struktur data. Referensi yang tidak dapat diselesaikan (*unresolvable*) akan mengembalikan nilai `null`.
- **Interning**: Proses memindahkan string literal berulang ke dalam Token Pool terpusat guna menghemat token.
- **Escaping**: Mekanisme andal untuk menangani penanda struktural yang ditemukan sebagai bagian dari teks literal asli.

### 2.1 Payload & Aturan Struktural
- **Pure ADN**: Payload ADN tidak memiliki batasan seperti bracket atau marker envelope. Payload dimulai secara natural dengan Token Pool (`❖`) atau Grid (`ⓖ`).
- **Token Pool**: Diperlukan di awal payload jika data mengandung Value Reference (`¤`). Jika tidak ada Value Reference, pool tidak disertakan.
- **Optional Payload Blocks**: Blok data payload (seperti Grid/Set) bersifat sepenuhnya **opsional**. Payload yang valid dapat hanya terdiri dari Token Pool saja, tanpa blok data tambahan di belakangnya.
- **Multi-Grid Capability**: Satu payload MarkZero dapat memuat **beberapa** blok Grid (`ⓖ`), masing-masing dengan judul opsional yang disematkan antara `ⓖ` dan `ᴄ`, memungkinkan penyusunan data kompleks yang terdiri dari berbagai set/grid berbeda dalam satu aliran data tunggal.
- **Auto Grid Indexing**: Setiap blok Grid (`ⓖ`) yang diproses di dalam payload akan secara otomatis diberikan indeks urutan bertahap mulai dari `0`. Indeks urutan otomatis ini digunakan oleh Grid Referencing (`※`) untuk mereferensikan kembali blok data sebelumnya (contohnya `※0`, `※1`).
- **Empty Collections**: Map kosong `{}` dan List/Set kosong `[]` secara konsisten diserialisasikan menjadi bentuk struktural paling minimal: `ⓖ` (Grid Start).
- **Penghilangan Separator Trailing**: Encoder BOLEH menghilangkan `¦` trailing ketika sel-sel terakhir di akhir baris kosong. Decoder WAJIB memperlakukan sel trailing yang hilang sebagai string kosong (`""`). Ini menghemat satu token per sel yang dihilangkan.
- **Unresolvable Referencing**: Grid referencing yang tidak terpetakan atau yang mengandung referensi diri (*self-reference*) atau ketergantungan melingkar (*circular dependency*) (contoh: `※0` yang mereferensikan indeks grid `0` sewaktu mendekode dirinya sendiri) akan diselesaikan menjadi `null` demi mencegah rekursi tak terbatas.

### 2.2 Penanda Escaper (`ɛ`)
Guna menjamin tidak terjadinya tabrakan data (*collision*) bahkan ketika membahas format notasi ini sendiri, setiap penanda struktural yang ditemukan di dalam teks literal wajib di-escape dengan didahului oleh penanda **Escaper (`ɛ`)**:
*   **Karakter Penanda Literal**: Untuk menyertakan karakter struktural (seperti `¦`, `ⓖ`, `ᴄ`, atau `ʀ`) sebagai teks literal biasa, tambahkan awalan: `ɛ¦`, `ɛⓖ`, `ɛᴄ`, `ɛʀ`.
*   **Escaper Literal**: Untuk menyertakan karakter `ɛ` sebagai teks literal biasa, karakter tersebut harus ditulis ganda: `ɛɛ`.

*Spesifikasi Resmi MarkZero - Senin, 25 Mei 2026*
