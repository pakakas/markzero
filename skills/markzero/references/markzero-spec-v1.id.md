# Spesifikasi MarkZero (v1)

> **"Markup is for Screens. Markdown is for Docs. MarkZero is for Intelligence."**

## Ringkasan
**MarkZero** adalah format serialisasi AI-native yang sangat efisien yang dirancang khusus untuk Large Language Models. Format ini merepresentasikan data dalam ruang laten multi-dimensi, yang dioptimalkan untuk atensi AI ketimbang hierarki visual manusia.

| Tingkat Antarmuka | Jenis Notasi | Arah Atensi | Target Penerima |
| :--- | :--- | :--- | :--- |
| **User Interface (UI)** | **Mark-UP** | Ke Atas | Mata Manusia |
| **Developer Interface (DX)** | **Mark-DOWN** | Linear | Logika Manusia |
| **Agent Interface (AX)** | **MarkZero** | **Omni (N-Dim)** | **Atensi AI** |

## 1. Penanda Struktural (Structural Markers)

| Peran | Karakter | Nama Unicode | Deskripsi |
| :--- | :---: | :--- | :--- |
| **Start Marker** | `ⓜ` | U+24DC (CIRCLED LATIN SMALL LETTER M) | Setiap payload MarkZero selalu dimulai dengan penanda ini. |
| **Value Marker** | `·` | U+00B7 (MIDDLE DOT) | Portal untuk mendefinisikan string ter-intern di dalam Token Pool. |
| **Grid Marker** | `ⓖ` | U+24D6 (CIRCLED LATIN SMALL LETTER G) | Menandai awal dari sebuah Grid block. |
| **Column Marker** | `ᴄ` | U+1D04 (LATIN LETTER SMALL CAPITAL C) | Menandai bagian tajuk/kolom di dalam sebuah Grid. |
| **Row Marker** | `ʀ` | U+0280 (LATIN LETTER SMALL CAPITAL R) | Menandai awal dari sebuah item Set, properti Map, atau baris Grid. |
| **Row Separator** | `¦` | U+00A6 (BROKEN BAR) | Memisahkan sel data di dalam satu baris Grid. |
| **Relation Binder** | `→` | U+2192 (RIGHTWARDS ARROW) | Mengikat kunci (*key*) ke nilai (*value*) pada properti Map. |
| **Value Ref** | `¤` | U+00A4 (CURRENCY SIGN) | Portal ke sebuah string ter-intern di dalam Token Pool (berdasarkan Indeks). |
| **Grid Ref** | `※` | U+203B (REFERENCE MARK) | Portal ke blok data yang telah didefinisikan sebelumnya (berdasarkan Indeks). |
| **Title Marker** | `★` | U+2605 (BLACK STAR) | Penanda awalan untuk judul blok data. |
| **Close Marker** | `ⓩ` | U+24E9 (CIRCLED LATIN SMALL LETTER Z) | Menutup blok secara simetris (bersifat sepenuhnya opsional). |
| **Escaper** | `Ɇ` | U+0246 (LATIN CAPITAL LETTER E WITH STROKE) | Digunakan untuk meng-escape penanda struktural di dalam konten literal. |

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
- **Start Marker (`ⓜ`)**: Setiap payload harus diawali oleh start marker.
- **Symmetric Optional Closing Marker (`ⓩ`)**: Setiap blok (Token Pool, Judul, atau Grid) dapat ditutup secara eksplisit oleh penanda `ⓩ`. Namun, penutup ini bersifat sepenuhnya **opsional**. Jika diabaikan (karena batasan token, akhir transmisi/EOF, atau transisi percakapan di dalam respons LLM yang bercampur dengan bahasa manusia), blok secara implisit ditutup oleh awal blok berikutnya (seperti `ⓖ` atau `★`) atau oleh Akhir Dokumen (EOF). Teks bahasa manusia setelah blok terakhir ditutup akan diabaikan secara elegan.
- **Token Pool**: Terletak setelah start marker. Token pool bersifat **wajib ada** jika payload mengandung setidaknya satu Value Reference (`¤`). Jika tidak ada Value Reference, bagian pool akan ditiadakan.
- **Optional Payload Blocks**: Blok data payload (seperti Grid/Set) bersifat sepenuhnya **opsional**. Payload yang valid dapat hanya terdiri dari start marker saja (`ⓜ`) atau start marker disertai Token Pool saja, tanpa blok data tambahan di belakangnya.
- **Multi-Grid Capability**: Satu payload MarkZero dapat memuat **beberapa** blok Grid (`ⓖ`) dan blok Title (`★`), memungkinkan penyusunan data kompleks yang terdiri dari berbagai set/grid berbeda dalam satu aliran data tunggal.
- **Auto Grid Indexing**: Setiap blok Grid (`ⓖ`) yang diproses di dalam payload akan secara otomatis diberikan indeks urutan bertahap mulai dari `0`. Indeks urutan otomatis ini digunakan oleh Grid Referencing (`※`) untuk mereferensikan kembali blok data sebelumnya (contohnya `※0`, `※1`).
- **Empty Collections**: Map kosong `{}` dan List/Set kosong `[]` secara konsisten diserialisasikan menjadi bentuk struktural paling minimal: `ⓜⓖⓩ` (Start Marker + Grid Start + Close Marker).
- **Unresolvable Referencing**: Grid referencing yang tidak terpetakan atau yang mengandung referensi diri (*self-reference*) atau ketergantungan melingkar (*circular dependency*) (contoh: `※0` yang mereferensikan indeks grid `0` sewaktu mendekode dirinya sendiri) akan diselesaikan menjadi `null` demi mencegah rekursi tak terbatas.

### 2.2 Penanda Escaper (`Ɇ`)
Guna menjamin tidak terjadinya tabrakan data (*collision*) bahkan ketika membahas format notasi ini sendiri, setiap penanda struktural yang ditemukan di dalam teks literal wajib di-escape dengan didahului oleh penanda **Escaper (`Ɇ`)**:
*   **Karakter Penanda Literal**: Untuk menyertakan karakter struktural (seperti `¦`, `ⓖ`, `★`, `ᴄ`, atau `ʀ`) sebagai teks literal biasa, tambahkan awalan: `Ɇ¦`, `Ɇⓖ`, `Ɇ★`, `Ɇᴄ`, `Ɇʀ`.
*   **Escaper Literal**: Untuk menyertakan karakter `Ɇ` sebagai teks literal biasa, karakter tersebut harus ditulis ganda: `ɆɆ`.

*Spesifikasi Resmi MarkZero - Senin, 25 Mei 2026*
