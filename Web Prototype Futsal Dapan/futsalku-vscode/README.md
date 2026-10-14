# FutsalKu — Website Booking Lapangan

Website demo booking lapangan futsal milik Davan Herlen Juliarta.

## Menjalankan di VS Code
1. Ekstrak folder `futsalku-vscode`.
2. Buka folder tersebut di Visual Studio Code.
3. Buka `index.html` langsung di browser, atau pasang ekstensi **Live Server** lalu klik kanan `index.html` → **Open with Live Server**.

## Struktur
- `index.html` — struktur halaman dan form
- `style.css` — desain responsif
- `app.js` — kalender 14 hari, booking, QR, dan portal staff

## Mengubah harga dan DP
Di bagian atas `app.js`, ubah:
```js
const HARGA_PER_JAM = 150000;
const PERSEN_DP = 0.30;
```

## Catatan penting
Ini masih prototype front-end. Data disimpan di `localStorage`, jadi hanya tersedia pada browser/perangkat yang sama. QR menggunakan layanan QR eksternal dan memerlukan internet untuk memuat gambar. Metode QRIS/transfer masih simulasi, bukan transaksi uang sungguhan. Portal staff belum memiliki login. Untuk penggunaan nyata, bangun backend/API, database bersama, autentikasi role owner/staff, validasi slot di server, dan integrasi payment gateway (misalnya Midtrans/Xendit) sebelum menerima pembayaran.
