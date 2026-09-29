import type {
  DailyDispatchItem,
  EnrichedCateringCustomer,
  MealSlot,
} from './catering';

export function cleanWhatsAppPhone(phone: string): string {
  let cleaned = (phone || '').replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (!cleaned.startsWith('62') && cleaned.length >= 8) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

export const normalizeWhatsAppPhone = cleanWhatsAppPhone;

export function buildWhatsAppLink(phone: string, text: string): string {
  const cleanPhone = cleanWhatsAppPhone(phone);
  const encoded = encodeURIComponent(text);
  if (!cleanPhone) {
    return `https://wa.me/?text=${encoded}`;
  }
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}

export function generateDispatchWhatsAppText(item: DailyDispatchItem, baseUrl = ''): string {
  const slotLabel = item.meal_slot === 'L' ? '☀️ Lunch' : '🌙 Dinner';
  const timeEst = item.meal_slot === 'L' ? '11:00 – 12:00 WIB' : '16:30 – 17:30 WIB';
  const menu = item.category === 'LAUK' ? 'Lauk Only (Protein & Sayur tanpa nasi)' : item.menu_note || 'Herbox Personal Catering';
  const portalUrl = baseUrl ? `${baseUrl}/catering/portal/${item.customer_id}` : '';

  let msg = `Halo Kak ${item.customer_name}! 🥗\n\n`;
  msg += `Herbox Personal Catering kamu untuk *${slotLabel} hari ini* sudah masuk antrean kurir:\n`;
  msg += `📦 Menu: ${menu}\n`;
  msg += `📍 Alamat: ${item.delivery_address || 'Sesuai pesanan'}\n`;
  msg += `⏰ Estimasi sampai: ${timeEst}\n\n`;
  msg += `📊 *Sisa kuota katering kamu:* *${item.boxes_left_to_deliver} box* (estimasi selesai: ${item.projected_last_date || 'terjadwal'}).\n\n`;
  if (portalUrl) {
    msg += `📲 Cek kalender & atur jadwal/skip makan di Portal Pribadi kamu:\n${portalUrl}\n\n`;
  }
  msg += `Selamat menikmati makanan sehat Herbox hari ini! 🌱`;
  return msg;
}

export function generateRenewalWhatsAppText(cust: EnrichedCateringCustomer, baseUrl = ''): string {
  const pkgName = cust.active_package?.package_name || 'Paket Katering';
  const sisa = cust.active_boxes_left_to_deliver;
  const lastDate = cust.projected_last_date || 'dalam beberapa hari ke depan';
  const portalUrl = baseUrl ? `${baseUrl}/catering/portal/${cust.customer_id}` : '';

  let msg = `Halo Kak ${cust.customer_name}! 👋\n\n`;
  msg += `Semoga selalu sehat ya. Kami mau infokan bahwa paket katering Herbox kamu (*${pkgName}*) saat ini *tersisa ${sisa} box* dan dijadwalkan selesai pada *${lastDate}*.\n\n`;
  msg += `Biar rutinitas makan sehatmu nggak terputus, mau sekalian perpanjang (extend) untuk periode berikutnya? 🥬\n\n`;
  msg += `Pilihan paket hemat Herbox:\n`;
  if (cust.category === 'LAUK') {
    msg += `• 16 Box Lauk Only (2x/minggu L+D): Rp 608.000\n`;
    msg += `• 32 Box Lauk Only: Rp 1.150.000\n\n`;
  } else {
    msg += `• 5 Days · 5 Box Plan: Rp 240.000\n`;
    msg += `• 5 Days · 10 Box (L+D): Rp 460.000\n`;
    msg += `• 20 Box Monthly Plan: Rp 880.000\n`;
    msg += `• 56 Box Extended Super Saver: Rp 2.408.000\n\n`;
  }
  if (portalUrl) {
    msg += `Cek riwayat box kamu di sini:\n${portalUrl}\n\n`;
  }
  msg += `Balas chat ini jika ingin kami buatkan invoice & amankan jadwal pengiriman ya Kak! Terima kasih. 🙏`;
  return msg;
}

export function generateSkipConfirmationWhatsAppText(
  custName: string,
  date: string,
  slot: MealSlot,
  sisaBoxes: number,
  newLastDate?: string | null
): string {
  const slotLabel = slot === 'L' ? 'Lunch' : 'Dinner';
  let msg = `Halo Kak ${custName}! 👌\n\n`;
  msg += `Jadwal makan katering Herbox kamu untuk *${date} (${slotLabel})* sudah berhasil di-skip (*OFF*) sesuai request ya.\n\n`;
  msg += `🔒 *Kuota box kamu aman (tidak terpotong):*\n`;
  msg += `• Sisa kuota tetap: *${sisaBoxes} box*\n`;
  if (newLastDate) {
    msg += `• Estimasi selesai paket otomatis diperpanjang ke: *${newLastDate}*\n`;
  }
  msg += `\nSampai jumpa di pengiriman berikutnya! 🌱`;
  return msg;
}

export function generatePortalShareWhatsAppText(cust: EnrichedCateringCustomer, baseUrl: string): string {
  const portalUrl = `${baseUrl}/catering/portal/${cust.customer_id}`;
  let msg = `Halo Kak ${cust.customer_name}! 🌿\n\n`;
  msg += `Ini link *Self-Service Catering Portal* pribadi kamu di Herbox:\n`;
  msg += `👉 ${portalUrl}\n\n`;
  msg += `Lewat link ini, kamu bisa langsung:\n`;
  msg += `✅ Cek sisa kuota katering (*Sisa ${cust.active_boxes_left_to_deliver} box*)\n`;
  msg += `✅ Lihat kalender pengiriman bulan ini\n`;
  msg += `✅ 1-Click *Skip Tanggal (OFF)* jika ada agenda keluar kota (kuota otomatis rollover!)\n`;
  msg += `✅ Swap jam makan (Lunch ↔ Dinner)\n\n`;
  msg += `Simpan link ini di bookmark HP kamu ya Kak! Selamat menikmati. ✨`;
  return msg;
}
