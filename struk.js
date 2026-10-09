/* Kantong — pembaca struk.
 * OCR berjalan di perangkat pengguna (Tesseract.js); gambar struk tidak dikirim ke server Kantong.
 * parseReceipt() murni (tanpa DOM) supaya bisa diuji terpisah. */
(function (root) {
  "use strict";

  const TESSERACT_URL = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";

  /* Toko yang sering muncul → kategori Kantong */
  const MERCHANTS = [
    [/indomaret|alfamart|alfamidi|alfa\s?express|superindo|super\s?indo|hypermart|transmart|carrefour|lotte\s?mart|giant|hero\s|ranch\s?market|farmers\s?market|grand\s?lucky|foodhall|aeon|yogya|tip\s?top|sayurbox|lawson|family\s?mart|circle\s?k|7-?eleven/i, "c-groceries"],
    [/starbucks|kopi\s?kenangan|janji\s?jiwa|fore\s?coffee|tomoro|point\s?coffee|kopi\s?soe|excelso|mcdonald|mc\s?d|kfc|burger\s?king|pizza\s?hut|domino|hokben|hoka\s?hoka|yoshinoya|marugame|solaria|richeese|chatime|mixue|gacoan|wingstop|a&w|bakmi\s?gm|es\s?teh|haus!?|warteg|resto|restaurant|cafe|kafe|bakery|roti/i, "c-food"],
    [/pertamina|spbu|shell|bp\s?akr|vivo\s?energy|parkir|parking|e-?toll|jasa\s?marga|blue\s?bird|kai\s|commuter/i, "c-transport"],
    [/apotek|apotik|kimia\s?farma|k-24|guardian|century|watsons|klinik|rumah\s?sakit|hospital|laborator/i, "c-health"],
    [/ace\s?hardware|informa|ikea|mitra\s?10|depo\s?bangunan|electronic|erafone|ibox|electronic\s?city/i, "c-home"],
    [/uniqlo|h&m|zara|matahari|miniso|sociolla|sephora|eiger|sports\s?station|planet\s?sports|cotton\s?ink/i, "c-shop"],
    [/gramedia|periplus|toko\s?buku/i, "c-edu"],
    [/xxi|cgv|cinepolis|timezone|playground/i, "c-fun"],
    [/pln|pdam|indihome|biznet|first\s?media|telkomsel|xl\s|indosat|tri\s|smartfren/i, "c-bills"],
    [/kids|baby|bayi|mothercare|babyshop/i, "c-baby"],
  ];

  const TOTAL_KEYS = [
    [/grand\s*total|total\s*bayar|total\s*belanja|total\s*pembayaran|total\s*tagihan|total\s*harga|jumlah\s*bayar|total\s*due|amount\s*due|total\s*amount/i, 3],
    [/\btotal\b|\bttl\b/i, 2],
    [/\bjumlah\b|\btagihan\b|\bnetto?\b|\bbayar\b/i, 1],
  ];
  const NOT_TOTAL = /sub\s*-?\s*tot|total\s*(item|qty|kuantitas|jml|disc|diskon|hemat|potongan|ppn|pajak|tax|point|poin)|kembali|change|hemat|diskon|discount|potongan|jumlah\s*(item|barang|qty)|item\s*\d|qty/i;
  const NOT_ITEM = /harga\s*jual|harga\s*\/|\/\s*liter|liter|waktu|tgl|jenis|spbu|pompa|nozzle|shift|total|subtotal|sub\s*tot|tunai|cash|kembali|change|debit|kredit|credit|card|kartu|ppn|pajak|tax|diskon|disc|hemat|potongan|voucher|poin|point|bayar|npwp|telp|phone|kasir|cashier|struk|receipt|tanggal|date|jam|time|terima\s*kasih|thank|member|saldo|qris|ovo|gopay|dana|shopeepay|linkaja|edc|ref|trx|no\.|nomor|item|qty|jumlah|service|pb1|rounding|pembulatan/i;
  const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, mei: 5, may: 5, jun: 6, jul: 7, agu: 8, agt: 8, aug: 8, sep: 9, okt: 10, oct: 10, nov: 11, des: 12, dec: 12 };

  /* Perbaiki salah baca OCR di dalam angka: O→0, l/I→1 */
  function cleanLine(l) {
    let prev;
    do { prev = l; l = l.replace(/(?<=[\d.,])[oO]|[oO](?=\d)/g, "0").replace(/(?<=[\d.,])[lI|](?=[\d.,])/g, "1"); } while (l !== prev);
    return l.replace(/\s{2,}/g, "  ").trim();
  }
  /* Buang tanggal & jam supaya tidak terbaca sebagai nominal */
  function stripDates(l) {
    return l.replace(/\b\d{1,4}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\b/g, " ")
            .replace(/\b\d{1,2}\s*(jan|feb|mar|apr|mei|may|jun|jul|agu|agt|aug|sep|okt|oct|nov|des|dec)[a-z]*\.?\s*\d{2,4}\b/gi, " ")
            .replace(/\b\d{1,2}[:.]\d{2}([:.]\d{2})?\b(?![.,]\d{3})/g, " ");
  }

  /* Ambil semua nominal (Rupiah) dari satu baris */
  function amounts(line) {
    const out = [];
    line = stripDates(line);
    const re = /(?:rp\.?\s*)?(-?\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?|\d{3,9}(?:[.,]\d{2})?)(?![\d])/gi;
    let m;
    while ((m = re.exec(line))) {
      let s = m[1];
      if (s.startsWith("-")) continue;
      s = s.replace(/[.,]\d{1,2}$/, (x) => (/[.,]\d{3}/.test(s) || s.replace(/[.,]\d{1,2}$/, "").length >= 3 ? "" : x));
      const v = parseInt(s.replace(/[.,]/g, ""), 10);
      if (v >= 100 && v <= 100000000) out.push(v);
    }
    return out;
  }

  function findDate(lines, today) {
    const now = today ? new Date(today + "T12:00:00") : new Date();
    const ok = (y, m, d) => {
      if (y < 100) y += 2000;
      if (m < 1 || m > 12 || d < 1 || d > 31) return null;
      const dt = new Date(y, m - 1, d);
      if (dt.getMonth() !== m - 1) return null;
      const diff = (now - dt) / 864e5;
      if (diff < -1 || diff > 400) return null;
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    };
    for (const l of lines) {
      let m;
      if ((m = l.match(/\b(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})\b/))) { const r = ok(+m[1], +m[2], +m[3]); if (r) return r; }
      if ((m = l.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/))) { const r = ok(+m[3], +m[2], +m[1]); if (r) return r; }
      if ((m = l.match(/\b(\d{1,2})[\s\-.\/]*(jan|feb|mar|apr|mei|may|jun|jul|agu|agt|aug|sep|okt|oct|nov|des|dec)[a-z]*\.?[\s\-.\/,]*(\d{2,4})\b/i))) {
        const r = ok(+m[3], MONTHS[m[2].toLowerCase()], +m[1]); if (r) return r;
      }
    }
    return "";
  }

  function titleCase(s) {
    return s.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase()).replace(/\bPt\b/g, "PT").replace(/\bTbk\b/g, "Tbk");
  }

  function findMerchant(lines) {
    const head = lines.slice(0, 6).filter((l) => !amounts(l).length).join("\n");
    for (const [re] of MERCHANTS) {
      const m = head.match(re);
      if (m) {
        const hit = lines.find((l) => re.test(l));
        if (hit && hit.replace(/[^a-z]/gi, "").length <= 30) return titleCase(hit.replace(/[^\w&'.\- ]/g, " ").replace(/\s+/g, " ").trim());
        return titleCase(m[0]);
      }
    }
    for (const l of lines.slice(0, 6)) {
      if (amounts(l).length) continue;
      const letters = (l.match(/[a-z]/gi) || []).length;
      if (letters < 3 || letters / l.length < 0.55) continue;
      if (/(jl\.?|jalan|telp|npwp|struk|receipt|kasir|tanggal|date|no\.|www|http|@|ruko|blok|kav\.|rt\s?\d|rw\s?\d)/i.test(l)) continue;
      return titleCase(l.replace(/[^\w&'.\- ]/g, " ").replace(/\s+/g, " ").trim()).slice(0, 40);
    }
    return "";
  }

  function merchantCategory(text) {
    for (const [re, cat] of MERCHANTS) if (re.test(text)) return cat;
    return "";
  }

  function findTotal(lines) {
    let best = null;
    lines.forEach((l, i) => {
      if (NOT_TOTAL.test(l)) return;
      for (const [re, score] of TOTAL_KEYS) {
        if (!re.test(l)) continue;
        let a = amounts(l);
        if (!a.length && lines[i + 1] && !NOT_TOTAL.test(lines[i + 1])) a = amounts(lines[i + 1]);
        if (!a.length) break;
        const v = Math.max(...a);
        if (!best || score > best.score || (score === best.score && v > best.v)) best = { v, score, i };
        break;
      }
    });
    if (best) return best;
    // Cadangan: nominal terbesar, abaikan baris pembayaran/kembalian
    let v = 0, idx = -1;
    lines.forEach((l, i) => {
      if (/(tunai|cash|kembali|change|debit|kredit|card|npwp|telp|saldo|ref|no\.)/i.test(l)) return;
      for (const x of amounts(l)) if (x > v) { v = x; idx = i; }
    });
    return v ? { v, score: 0, i: idx } : null;
  }

  function findItems(lines, totalIdx) {
    const end = totalIdx >= 0 ? totalIdx : lines.length;
    const items = [];
    let pending = "";
    for (let i = 0; i < end; i++) {
      const l = lines[i];
      if (NOT_ITEM.test(l)) { pending = ""; continue; }
      const a = amounts(l);
      const name = l.replace(/(?:rp\.?\s*)?\d[\d.,]*\s*(x|@|pcs|pc|bh|buah|kg|gr|g|ml|l)?\b/gi, " ").replace(/[^a-z0-9&'%\-\/ ]/gi, " ").replace(/\s+/g, " ").trim();
      const letters = (name.match(/[a-z]/gi) || []).length;
      if (a.length && letters >= 3) { items.push({ name: titleCase(name).slice(0, 40), amount: a[a.length - 1] }); pending = ""; }
      else if (a.length && pending) { items.push({ name: titleCase(pending).slice(0, 40), amount: a[a.length - 1] }); pending = ""; }
      else if (!a.length && letters >= 3 && i > 0) { pending = name; }
      if (items.length >= 40) break;
    }
    return items;
  }

  function parseReceipt(text, today) {
    const lines = String(text || "").split(/\r?\n/).map(cleanLine).filter((l) => l.replace(/[^a-z0-9]/gi, "").length >= 2);
    const joined = lines.join("\n");
    const total = findTotal(lines);
    const items = findItems(lines, total ? total.i : -1).filter((it, _, arr) => !total || it.amount < total.v || arr.length === 1);
    return {
      total: total ? total.v : 0,
      totalSure: !!(total && total.score > 0),
      date: findDate(lines, today),
      merchant: findMerchant(lines),
      merchantCat: merchantCategory(joined),
      items,
      lines: lines.length,
    };
  }

  /* --- OCR di browser --- */
  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error("Gagal memuat pembaca struk. Periksa koneksi internet.")); document.head.appendChild(s); });
  }
  async function imageToCanvas(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("Gambar tidak bisa dibuka. Coba foto ulang atau pilih gambar JPG/PNG.")); i.src = url; });
      const maxW = 1600, minW = 1000;
      let w = img.naturalWidth, h = img.naturalHeight;
      const scale = w > maxW ? maxW / w : w < minW ? minW / w : 1;
      w = Math.round(w * scale); h = Math.round(h * scale);
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, w, h);
      // Abu-abu + tarik kontras supaya teks struk thermal lebih tegas
      const d = ctx.getImageData(0, 0, w, h), p = d.data;
      let lo = 255, hi = 0;
      for (let k = 0; k < p.length; k += 16) { const g = p[k] * 0.299 + p[k + 1] * 0.587 + p[k + 2] * 0.114; if (g < lo) lo = g; if (g > hi) hi = g; }
      const span = Math.max(40, hi - lo);
      for (let k = 0; k < p.length; k += 4) {
        let g = p[k] * 0.299 + p[k + 1] * 0.587 + p[k + 2] * 0.114;
        g = Math.max(0, Math.min(255, ((g - lo) / span) * 255));
        g = g < 128 ? g * 0.6 : 255 - (255 - g) * 0.6;
        p[k] = p[k + 1] = p[k + 2] = g;
      }
      ctx.putImageData(d, 0, 0);
      return c;
    } finally { URL.revokeObjectURL(url); }
  }
  async function scan(file, onProgress) {
    onProgress && onProgress(0, "Menyiapkan pembaca struk…");
    if (!root.Tesseract) await loadScript(TESSERACT_URL);
    const canvas = await imageToCanvas(file);
    onProgress && onProgress(0.05, "Memuat model bahasa (pertama kali agak lama)…");
    const worker = await root.Tesseract.createWorker(["ind", "eng"], 1, {
      logger: (m) => { if (m.status === "recognizing text" && onProgress) onProgress(0.1 + m.progress * 0.9, "Membaca struk…"); },
    });
    try {
      const { data } = await worker.recognize(canvas);
      return Object.assign(parseReceipt(data.text), { text: data.text, confidence: data.confidence });
    } finally { worker.terminate(); }
  }

  root.KantongStruk = { parseReceipt, scan, amounts };
  if (typeof module !== "undefined") module.exports = root.KantongStruk;
})(typeof window !== "undefined" ? window : globalThis);
