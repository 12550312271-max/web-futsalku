// FutsalKu — demo front-end. Penyimpanan masih memakai localStorage browser.
const HARGA_PER_JAM = 150000;
const PERSEN_DP = 0.30;
const KEY_BOOKINGS = "futsalku_bookings_v1";
const JAM_TERSEDIA = ["08:00","09:00","10:00","11:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00"];
const HARI = 86400000;
let offsetHari = 0;
let tanggalDipilih = null;
let jamDipilih = null;

const el = id => document.getElementById(id);
const rupiah = angka => "Rp" + Number(angka).toLocaleString("id-ID");
const kunciTanggal = tanggal => `${tanggal.getFullYear()}-${String(tanggal.getMonth()+1).padStart(2,"0")}-${String(tanggal.getDate()).padStart(2,"0")}`;
const formatTanggal = tanggal => tanggal.toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
const bacaBooking = () => { try { return JSON.parse(localStorage.getItem(KEY_BOOKINGS) || "[]"); } catch { return []; } };
const simpanBooking = data => localStorage.setItem(KEY_BOOKINGS, JSON.stringify(data));
const aman = teks => String(teks ?? "").replace(/[&<>"']/g, karakter => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[karakter]));

function toast(pesan) {
  const box = el("toast"); box.textContent = pesan; box.style.display = "block";
  clearTimeout(toast.timer); toast.timer = setTimeout(() => box.style.display = "none", 2600);
}

function gambarQR(booking) {
  // QR dibuat oleh layanan eksternal; koneksi internet diperlukan untuk memuat gambar.
  const data = encodeURIComponent(`FUTSALKU|${booking.id}|${booking.nama}|${booking.telepon}|${booking.tanggal}|${booking.jam}`);
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${data}`;
}

function gambarRentangTanggal() {
  const hariIni = new Date(); hariIni.setHours(0,0,0,0);
  const mulai = new Date(hariIni); mulai.setDate(mulai.getDate() + offsetHari);
  const akhir = new Date(mulai); akhir.setDate(akhir.getDate() + 13);
  el("periodLabel").textContent = `${mulai.toLocaleDateString("id-ID",{day:"numeric",month:"short"})} – ${akhir.toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})}`;

  const daftarHari = el("days"); daftarHari.innerHTML = "";
  for (let i=0; i<14; i++) {
    const tanggal = new Date(mulai); tanggal.setDate(mulai.getDate()+i);
    const tombol = document.createElement("button");
    tombol.type = "button";
    tombol.className = "day" + (tanggalDipilih && kunciTanggal(tanggal)===kunciTanggal(tanggalDipilih) ? " selected" : "");
    tombol.innerHTML = `<small>${tanggal.toLocaleDateString("id-ID",{weekday:"short"})}</small><b>${tanggal.getDate()}</b><small>${tanggal.toLocaleDateString("id-ID",{month:"short"})}</small>`;
    tombol.addEventListener("click", () => { tanggalDipilih=tanggal; jamDipilih=null; gambarRentangTanggal(); gambarSlot(); perbaruiRingkasan(); });
    daftarHari.appendChild(tombol);
  }
  if (!tanggalDipilih || tanggalDipilih < mulai || tanggalDipilih > akhir) {
    tanggalDipilih = mulai; jamDipilih = null;
    gambarRentangTanggal(); gambarSlot(); perbaruiRingkasan();
  }
}

function gambarSlot() {
  el("selectedDateLabel").textContent = tanggalDipilih ? formatTanggal(tanggalDipilih) : "Pilih tanggal";
  const daftarSlot = el("slots"); daftarSlot.innerHTML = "";
  const booking = bacaBooking();
  JAM_TERSEDIA.forEach(jam => {
    const penuh = booking.some(item => item.tanggal===kunciTanggal(tanggalDipilih) && item.jam===jam && item.status!=="Dibatalkan");
    const tombol = document.createElement("button");
    tombol.type = "button";
    tombol.className = "slot" + (penuh ? " booked" : "") + (jamDipilih===jam ? " selected" : "");
    tombol.disabled = penuh;
    tombol.innerHTML = `${jam}<small>${penuh ? "Sudah dipesan" : "Sewa "+rupiah(HARGA_PER_JAM)}</small>`;
    tombol.addEventListener("click", () => { jamDipilih=jam; gambarSlot(); perbaruiRingkasan(); });
    daftarSlot.appendChild(tombol);
  });
}

function perbaruiRingkasan() {
  const dipilih = Boolean(tanggalDipilih && jamDipilih);
  el("sumSchedule").textContent = dipilih ? `${formatTanggal(tanggalDipilih)}, ${jamDipilih}` : "Belum dipilih";
  el("sumPrice").textContent = rupiah(dipilih ? HARGA_PER_JAM : 0);
  el("sumDP").textContent = rupiah(dipilih ? Math.round(HARGA_PER_JAM*PERSEN_DP) : 0);
  el("sumRemain").textContent = rupiah(dipilih ? Math.round(HARGA_PER_JAM*(1-PERSEN_DP)) : 0);
  el("submitBooking").disabled = !dipilih;
}

function statusClass(status) { return ["DP Terverifikasi","Lunas"].includes(status) ? "status green" : "status"; }

function gambarBookingSaya() {
  const wadah = el("myBookings"), booking = bacaBooking().slice().reverse();
  if (!booking.length) { wadah.innerHTML = '<div class="empty">Belum ada booking di browser ini. Pilih tanggal dan jam untuk mulai.</div>'; return; }
  wadah.innerHTML = booking.map(item => `
    <article class="booking">
      <div class="booking-top"><div><h3>${aman(item.labelTanggal)} • ${aman(item.jam)}</h3>
      <p>${aman(item.nama)} · ${aman(item.telepon)}</p><p>Kode: <b>${aman(item.id)}</b></p>
      <p>Total ${rupiah(item.harga)} · DP ${rupiah(item.dp)} · Sisa ${rupiah(Math.max(0,item.harga-item.terbayar))}</p></div>
      <span class="${statusClass(item.status)}">${aman(item.status)}</span></div>
      <div class="qr-row"><img class="qr" alt="QR booking ${aman(item.id)}" src="${gambarQR(item)}">
      <div><b>Tunjukkan QR ini kepada staff</b><p class="muted">Simpan kode booking jika QR tidak dapat dimuat.</p>
      <button class="btn secondary copy-code" data-code="${aman(item.id)}">Salin kode</button></div></div>
    </article>`).join("");
  wadah.querySelectorAll(".copy-code").forEach(button => button.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(button.dataset.code); toast("Kode booking disalin"); }
    catch { toast("Kode booking: "+button.dataset.code); }
  }));
}

function cariBookingStaff() {
  const kode = el("staffCode").value.trim().toUpperCase();
  const item = bacaBooking().find(booking => booking.id===kode);
  const hasil = el("staffResult");
  if (!item) { hasil.innerHTML = '<div class="empty">Booking tidak ditemukan pada browser ini. Periksa kode dan perangkat yang digunakan.</div>'; return; }
  const sisa = Math.max(0,item.harga-item.terbayar);
  hasil.innerHTML = `<article class="booking">
    <div class="booking-top"><div><p class="eyebrow">PROFIL PEMESAN</p><h2>${aman(item.nama)}</h2>
    <p>Nomor WhatsApp: <b>${aman(item.telepon)}</b></p><p>Email: ${aman(item.email||"-")}</p>
    <p>Catatan: ${aman(item.catatan||"-")}</p><p>Kode booking: <b>${aman(item.id)}</b></p></div>
    <span class="${statusClass(item.status)}">${aman(item.status)}</span></div>
    <div class="summary-mini"><p><span>Jadwal</span><b>${aman(item.labelTanggal)} • ${aman(item.jam)}</b></p>
    <p><span>Total sewa</span><b>${rupiah(item.harga)}</b></p><p><span>Total pembayaran tercatat</span><b>${rupiah(item.terbayar)}</b></p>
    <p><span>Sisa pembayaran</span><b>${rupiah(sisa)}</b></p><p><span>Metode pilihan</span><b>${aman(item.metode)}</b></p></div>
    <label>Jumlah uang yang diterima (Rp)<input id="staffAmount" type="number" min="0" max="${sisa}" value="${sisa}"></label>
    <button class="btn primary" id="savePayment">Catat pembayaran</button>
    <button class="btn secondary" id="verifyDP">Verifikasi DP</button>
    <button class="btn secondary" id="cancelBooking">Batalkan booking</button>
    <p class="help">Portal staff ini belum dilindungi login. Untuk operasional nyata, wajib memakai autentikasi dan backend.</p>
  </article>`;
  el("savePayment").addEventListener("click", () => {
    const jumlah = Math.max(0,Number(el("staffAmount").value)||0);
    ubahBooking(item.id, booking => {
      booking.terbayar = Math.min(booking.harga, booking.terbayar+jumlah);
      booking.status = booking.terbayar>=booking.harga ? "Lunas" : booking.terbayar>=booking.dp ? "DP Terverifikasi" : "Menunggu DP";
    });
    cariBookingStaff(); gambarBookingSaya(); gambarSlot(); toast("Pembayaran dicatat");
  });
  el("verifyDP").addEventListener("click", () => {
    ubahBooking(item.id, booking => { booking.terbayar=Math.max(booking.terbayar,booking.dp); booking.status=booking.terbayar>=booking.harga?"Lunas":"DP Terverifikasi"; });
    cariBookingStaff(); gambarBookingSaya(); toast("DP ditandai terverifikasi");
  });
  el("cancelBooking").addEventListener("click", () => {
    if (!confirm("Yakin ingin membatalkan booking ini?")) return;
    ubahBooking(item.id, booking => booking.status="Dibatalkan");
    cariBookingStaff(); gambarBookingSaya(); gambarSlot(); toast("Booking dibatalkan");
  });
}

function ubahBooking(id, callback) {
  const daftar=bacaBooking(), index=daftar.findIndex(item=>item.id===id);
  if(index<0) return; callback(daftar[index]); simpanBooking(daftar);
}

el("prevPeriod").addEventListener("click", () => { if(offsetHari>=14) { offsetHari-=14; gambarRentangTanggal(); } });
el("nextPeriod").addEventListener("click", () => { offsetHari+=14; gambarRentangTanggal(); });
el("goToSchedule").addEventListener("click", () => el("schedulePanel").scrollIntoView({behavior:"smooth"}));
el("refreshBookings").addEventListener("click", gambarBookingSaya);

el("bookingForm").addEventListener("submit", event => {
  event.preventDefault();
  if (!tanggalDipilih || !jamDipilih) return;
  const daftar=bacaBooking();
  if (daftar.some(item=>item.tanggal===kunciTanggal(tanggalDipilih)&&item.jam===jamDipilih&&item.status!=="Dibatalkan")) {
    toast("Slot baru saja dipesan orang lain"); gambarSlot(); return;
  }
  const metode=el("paymentMethod").value;
  const booking={
    id:"FK-"+Math.random().toString(36).slice(2,8).toUpperCase(),
    nama:el("customerName").value.trim(), telepon:el("customerPhone").value.trim(),
    email:el("customerEmail").value.trim(), catatan:el("customerNote").value.trim(),
    tanggal:kunciTanggal(tanggalDipilih), labelTanggal:formatTanggal(tanggalDipilih), jam:jamDipilih,
    harga:HARGA_PER_JAM, dp:Math.round(HARGA_PER_JAM*PERSEN_DP), terbayar:0,
    metode, status:"Menunggu DP", dibuat:new Date().toISOString()
  };
  daftar.push(booking); simpanBooking(daftar);
  el("staffCode").value=booking.id; el("bookingForm").reset();
  gambarSlot(); perbaruiRingkasan(); gambarBookingSaya(); toast("Booking berhasil dibuat: "+booking.id);
  document.querySelector('[data-tab="myTab"]').click();
});

document.querySelectorAll(".nav-btn").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll(".nav-btn").forEach(nav => nav.classList.toggle("active",nav===button));
  document.querySelectorAll(".tab-content").forEach(tab => tab.classList.toggle("active",tab.id===button.dataset.tab));
  if(button.dataset.tab==="myTab") gambarBookingSaya();
}));
el("staffSearch").addEventListener("submit", event => { event.preventDefault(); cariBookingStaff(); });

gambarRentangTanggal();
gambarSlot();
perbaruiRingkasan();
gambarBookingSaya();
