const API_URL = "https://script.google.com/macros/s/AKfycbywykI4s-HzeViIzYt6G7GjCJJqGnFKq-nDKVdQILZ8ye2dgmEid1yre2pz6LcnlgEO1g/exec"; 

const CHART_COLORS = [
  '#3b82f6', '#f97316', '#22c55e', '#a855f7', '#eab308', 
  '#06b6d4', '#ec4899', '#10b981', '#6366f1', '#14b8a6', 
  '#f43f5e', '#f59e0b', '#8b5cf6', '#d946ef'
];

let masterDataRiwayat = []; 
let editModeId = null; 

function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateDarkModeButton(isDark);
  
  // 🚀 SEAMLESS LOCK: Paksa warna status bar melebur sempurna tanpa garis pembatas
  const metaTheme = document.getElementById('nav-theme-color');
  if (metaTheme) {
    // #0f172a untuk menyatu dengan slate-900, #f8fafc untuk abu terang
    metaTheme.setAttribute('content', isDark ? '#0f172a' : '#f8fafc');
  }
  
  loadDashboardData(); 
}

function formatRupiah(angka) { 
  return 'Rp' + new Intl.NumberFormat('id-ID').format(Math.round(angka)); 
}

function renderYearsDropdown(yearsData) {
  const sel = document.getElementById('filterTahun');
  const currentVal = sel.value || new Date().getFullYear();
  sel.innerHTML = '';
  yearsData.allYears.forEach(y => { sel.innerHTML += `<option value="${y}">${y}</option>`; });
  if (yearsData.allYears.includes(parseInt(currentVal))) { sel.value = currentVal; } 
  else { sel.value = new Date().getFullYear(); }

  const container = document.getElementById('listTahunKustomContainer');
  const listDiv = document.getElementById('listTahunKustom');
  if (yearsData.customYears.length > 0) {
    container.classList.remove('hidden');
    listDiv.innerHTML = '';
    yearsData.customYears.sort((a,b) => a-b).forEach(y => {
      listDiv.innerHTML += `
        <span class="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 px-2 py-1 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 shadow-xs">
          ${y}
          <button type="button" onclick="deleteManualYear(${y})" class="text-red-500 hover:text-red-700 ml-0.5 font-black cursor-pointer text-[11px]">✕</button>
        </span>`;
    });
  } else { container.classList.add('hidden'); }
}

function initializeApplicationData(bln, thn) {
  fetch(`${API_URL}?action=getInitialData&bulan=${bln}&tahun=${thn}`)
    .then(res => res.json())
    .then(data => {
      renderYearsDropdown(data.years);
      document.getElementById('filterTahun').value = thn;

      const selKat = document.getElementById('inputKategori'); selKat.innerHTML = '';
      data.categories.forEach(k => { selKat.innerHTML += `<option value="${k}">${k}</option>`; });
      renderCategoriesManagement(data.categories);

      const selMet = document.getElementById('inputMetode'); selMet.innerHTML = '';
      data.paymentMethods.forEach(m => { selMet.innerHTML += `<option value="${m}">${m}</option>`; });

      masterDataRiwayat = data.recentTransactions;
      cetakTabelRiwayat(data.recentTransactions);
      renderDashboard(data.dashboard);

      const loader = document.getElementById('loadingScreen');
      if (loader) { loader.classList.add('opacity-0'); setTimeout(() => loader.remove(), 500); }
    })
    .catch(err => {
      console.error(err);
      const loader = document.getElementById('loadingScreen');
      if (loader) loader.remove();
    });
}

function loadYears(callback) {
  fetch(`${API_URL}?action=getYears`).then(res => res.json()).then(data => { renderYearsDropdown(data); if(callback) callback(); });
}

function saveManualYear() {
  const newYearStr = document.getElementById('inputTahunBaru').value.trim();
  if(!newYearStr) { showToast("Masukkan angka tahun valid!", "❌"); return; }
  const newYear = parseInt(newYearStr);
  fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'addYear', tahun: newYear }) })
  .then(res => res.json())
  .then(res => {
    if(res.success) {
      showToast(res.message, "✅");
      document.getElementById('inputTahunBaru').value = '';
      loadYears(() => { loadDashboardData(); });
    } else { showToast(res.message, "❌"); }
  });
}

function deleteManualYear(year) {
  if(!confirm(`Hapus opsi tahun ${year}?`)) return;
  fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteYear', tahun: year }) })
  .then(res => res.json())
  .then(res => {
    if(res.success) { showToast(res.message, "✅"); loadYears(() => { loadDashboardData(); }); } 
    else { showToast(res.message, "❌"); }
  });
}

function loadDashboardData() {
  const bln = document.getElementById('filterBulan').value;
  const thn = document.getElementById('filterTahun').value;
  if(!thn) return;
  initializeApplicationData(bln, thn);
}

function saveManualBudget() {
  const bln = document.getElementById('filterBulan').value;
  const thn = document.getElementById('filterTahun').value;
  const nominal = document.getElementById('inputSetBudget').value;
  if(!nominal || nominal <= 0) { showToast("Masukkan nominal valid!", "❌"); return; }
  fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'updateBudget', bulan: bln, tahun: thn, nominal: nominal }) })
  .then(res => res.json())
  .then(res => { if(res.success) { showToast(res.message, "✅"); initializeApplicationData(bln, thn); } });
}

function saveManualPaymentMethod() {
  const metode = document.getElementById('inputMetodeBaru').value.trim();
  if(!metode) { showToast("Masukkan nama metode valid!", "❌"); return; }
  fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'addPaymentMethod', metode: metode }) })
  .then(res => res.json())
  .then(res => {
    if(res.success) {
      showToast(res.message, "✅");
      document.getElementById('inputMetodeBaru').value = '';
      const bln = document.getElementById('filterBulan').value;
      const thn = document.getElementById('filterTahun').value;
      initializeApplicationData(bln, thn);
    } else { showToast(res.message, "❌"); }
  });
}

function kumpulkanDataKomparatif() {
  if (!window.lastDashboardData) return "Belum ada inisialisasi rekap data bulanan.";
  const d = window.lastDashboardData;
  let s = `Rangkuman Keuangan Bulanan:\n`;
  s += `- Total Biaya Terpakai: ${formatRupiah(d.totalPengeluaran)} dari plafon ${formatRupiah(d.budget)}\n`;
  s += `- Porsi Kontribusi: Harley (${formatRupiah(d.totalHarley)}), Rachel (${formatRupiah(d.totalRachel)})\n`;
  if (d.kategori) {
    s += `Alokasi Biaya per Kategori saat ini:\n`;
    Object.keys(d.kategori).forEach(k => { s += `  * ${k}: ${formatRupiah(d.kategori[k])}\n`; });
  }
  return s;
}

function triggerAiInsight() {
  const btn = document.getElementById('btn-generate-ai');
  const box = document.getElementById('aiInsightBox');
  
  btn.disabled = true;
  btn.innerHTML = `<div class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Membaca Data...</span>`;
  box.innerHTML = `<div class="flex items-center space-x-2 text-slate-400 dark:text-slate-500"><div class="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div><span class="italic animate-pulse">Data sedang dianalisis oleh Gemini... Mohon tunggu sebentar</span></div>`;

  let promptData = kumpulkanDataKomparatif();

  fetch(`${API_URL}?action=getGemini&data=${encodeURIComponent(promptData)}`)
    .then(res => res.json())
    .then(response => {
      if (response && response.success) { box.innerText = response.text; } 
      else {
        const errorMsg = response.text || response.error || response.message || JSON.stringify(response);
        if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("Limit")) {
          box.innerHTML = `⚠️ <span class="text-amber-500 dark:text-amber-400 font-bold">Server Gemini lagi ambil napas (Limit Gratisan 5x/menit). Tunggu sekitar 20 detik, lalu klik tombol lagi ya, Bro!</span>`;
        } else { box.innerHTML = `❌ <span class="text-red-500 font-semibold">Gagal membaca analisis. Detail Log: ${errorMsg}</span>`; }
      }
    })
    .catch(err => {
      console.error(err);
      box.innerHTML = `<span class="text-red-400 font-semibold">Gagal terhubung ke jembatan Google Apps Script Cloud.</span>`;
    })
    .finally(() => { btn.disabled = false; btn.innerHTML = `<span>⚡ Ambil Analisis AI</span>`; });
}

function renderDashboard(data) {
  window.lastDashboardData = data;

  document.getElementById('txtBudget').innerText = formatRupiah(data.budget);
  document.getElementById('inputSetBudget').value = data.budget;
  document.getElementById('txtHariIni').innerText = formatRupiah(data.totalHariIni);
  document.getElementById('txtMingguIni').innerText = formatRupiah(data.totalMingguIni);
  document.getElementById('txtRataRata').innerText = formatRupiah(data.rataRataHarian);
  document.getElementById('txtPrediksi').innerText = formatRupiah(data.prediksiAkhirBulan);
  document.getElementById('txtHarley').innerText = formatRupiah(data.totalHarley);
  document.getElementById('txtRachel').innerText = formatRupiah(data.totalRachel);
  document.getElementById('txtBudgetTerpakai').innerText = formatRupiah(data.totalPengeluaran);
  document.getElementById('txtTotalSemua').innerText = formatRupiah(data.totalPengeluaran);

  let lblHariIniTren = document.getElementById('lblHariIniTren');
  if (data.totalHariIniBulanLalu > 0) {
    let pct = ((data.totalHariIni - data.totalHariIniBulanLalu) / data.totalHariIniBulanLalu) * 100;
    if (pct > 0) lblHariIniTren.innerHTML = `<span class="text-red-500 font-bold">↑ ${pct.toFixed(1)}%</span>`;
    else if (pct < 0) lblHariIniTren.innerHTML = `<span class="text-emerald-500 font-bold">↓ ${Math.abs(pct).toFixed(1)}%</span>`;
    else lblHariIniTren.innerHTML = `<span class="text-slate-400 font-bold">═ 0.0%</span>`;
  } else { lblHariIniTren.innerHTML = `<span class="text-blue-500 font-bold">↑ 100%</span>`; }

  let lblMingguIniTren = document.getElementById('lblMingguIniTren');
  if (data.totalMingguIniBulanLalu > 0) {
    let pct = ((data.totalMingguIni - data.totalMingguIniBulanLalu) / data.totalMingguIniBulanLalu) * 100;
    if (pct > 0) lblMingguIniTren.innerHTML = `<span class="text-red-500 font-bold">↑ ${pct.toFixed(1)}%</span>`;
    else if (pct < 0) lblMingguIniTren.innerHTML = `<span class="text-emerald-500 font-bold">↓ ${Math.abs(pct).toFixed(1)}%</span>`;
    else lblMingguIniTren.innerHTML = `<span class="text-slate-400 font-bold">═ 0.0%</span>`;
  } else { lblMingguIniTren.innerHTML = `<span class="text-blue-500 font-bold">↑ 100%</span>`; }

  let lblRataRataTren = document.getElementById('lblRataRataTren');
  if (data.rataRataHarianBulanLalu > 0) {
    let pct = ((data.rataRataHarian - data.rataRataHarianBulanLalu) / data.rataRataHarianBulanLalu) * 100;
    if (pct > 0) lblRataRataTren.innerHTML = `<span class="text-red-500 font-bold">↑ ${pct.toFixed(1)}%</span>`;
    else if (pct < 0) lblRataRataTren.innerHTML = `<span class="text-emerald-500 font-bold">↓ ${Math.abs(pct).toFixed(1)}%</span>`;
    else lblRataRataTren.innerHTML = `<span class="text-slate-400 font-bold">═ 0.0%</span>`;
  } else { lblRataRataTren.innerHTML = `<span class="text-blue-500 font-bold">↑ 100%</span>`; }

  let lblTotalSemuaTren = document.getElementById('lblTotalSemuaTren');
  if (data.totalPengeluaranBulanLalu > 0) {
    let pctExpChange = ((data.totalPengeluaran - data.totalPengeluaranBulanLalu) / data.totalPengeluaranBulanLalu) * 100;
    if (pctExpChange > 0) lblTotalSemuaTren.innerHTML = `<span class="text-red-500 font-bold">↑ ${pctExpChange.toFixed(1)}%</span> dari bulan lalu`;
    else if (pctExpChange < 0) lblTotalSemuaTren.innerHTML = `<span class="text-emerald-500 font-bold">↓ ${Math.abs(pctExpChange).toFixed(1)}%</span> dari bulan lalu`;
    else lblTotalSemuaTren.innerHTML = `<span class="text-slate-400 font-bold">═ 0.0%</span> dari bulan lalu`;
  } else { lblTotalSemuaTren.innerHTML = `<span class="text-blue-500 font-bold">↑ 100%</span> dari bulan lalu`; }

  document.getElementById('txtBanyakTx').innerText = `${data.totalTxBulanIni} Tx`;
  let lblBanyakTxTren = document.getElementById('lblBanyakTxTren');
  if (data.totalTxBulanLalu > 0) {
    let pctTxChange = ((data.totalTxBulanIni - data.totalTxBulanLalu) / data.totalTxBulanLalu) * 100;
    if (pctTxChange > 0) lblBanyakTxTren.innerHTML = `<span class="text-red-500 font-bold">↑ ${pctTxChange.toFixed(1)}%</span> dari bulan lalu`;
    else if (pctTxChange < 0) lblBanyakTxTren.innerHTML = `<span class="text-emerald-500 font-bold">↓ ${Math.abs(pctTxChange).toFixed(1)}%</span> dari bulan lalu`;
    else lblBanyakTxTren.innerHTML = `<span class="text-slate-400 font-bold">═ 0.0%</span> dari bulan lalu`;
  } else { lblBanyakTxTren.innerHTML = `<span class="text-blue-500 font-bold">↑ 100%</span> dari bulan lalu`; }

  let sisaBudget = data.budget - data.totalPengeluaran;
  const lblSisaBudget = document.getElementById('txtSisaBudget');
  const cardBudget = document.getElementById('cardBudget');
  const barBudget = document.getElementById('barBudget');
  
  lblSisaBudget.innerText = formatRupiah(sisaBudget);

  cardBudget.classList.remove('animate-shake-panic', 'glow-panic-light', 'dark:glow-panic-dark');
  barBudget.classList.remove('bg-red-500');
  barBudget.classList.add('bg-blue-600');

  if(sisaBudget < 0) {
    lblSisaBudget.className = "text-sm sm:text-base font-black text-red-600 mt-0.5 tracking-tight animate-pulse";
    cardBudget.classList.add('animate-shake-panic', 'glow-panic-light', 'dark:glow-panic-dark');
    barBudget.classList.remove('bg-blue-600');
    barBudget.classList.add('bg-red-500');
  } else {
    lblSisaBudget.className = "text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 tracking-tight";
  }

  let pctTerpakai = data.budget > 0 ? Math.round((data.totalPengeluaran / data.budget) * 100) : 0;
  document.getElementById('txtPersenTerpakai').innerText = `Terpakai: ${pctTerpakai}%`;
  barBudget.style.width = `${Math.min(pctTerpakai, 100)}%`;

  let pctH = data.totalPengeluaran > 0 ? Math.round((data.totalHarley / data.totalPengeluaran) * 100) : 0;
  let pctR = data.totalPengeluaran > 0 ? Math.round((data.totalRachel / data.totalPengeluaran) * 100) : 0;
  document.getElementById('pctHarley').innerText = `${pctH}%`;
  document.getElementById('pctRachel').innerText = `${pctR}%`;
  document.getElementById('txtInfoHarley').innerText = `${pctH}% (${formatRupiah(data.totalHarley)})`;
  document.getElementById('txtInfoRachel').innerText = `${pctR}% (${formatRupiah(data.totalRachel)})`;

  let selisih = Math.abs(data.totalHarley - data.totalRachel);
  document.getElementById('txtSelisih').innerText = formatRupiah(selisih);
  document.getElementById('lblSelisih').innerText = data.totalHarley > data.totalRachel ? "Harley lebih tinggi" : "Rachel lebih tinggi";

  const tbodyRekap = document.getElementById('tabelRekapKategori');
  tbodyRekap.innerHTML = '';
  let katKeys = Object.keys(data.kategori).sort((a, b) => data.kategori[b] - data.kategori[a]);
  
  if(katKeys.length === 0) {
    tbodyRekap.innerHTML = `<tr><td colspan="2" class="py-2 text-slate-400 text-center dark:text-slate-500">Belum ada data</td></tr>`;
  } else {
    katKeys.forEach((key, idx) => {
      let dotColor = CHART_COLORS[idx % CHART_COLORS.length];
      tbodyRekap.innerHTML += `
        <tr class="hover:bg-white/60 dark:hover:bg-slate-700/40">
          <td class="py-1.5 font-bold text-slate-600 dark:text-slate-300 truncate flex items-center gap-2">
            <span class="w-2 h-2 rounded-full shrink-0 inline-block" style="background-color: ${dotColor}"></span>${key}
          </td>
          <td class="py-1.5 text-right font-black text-slate-900 dark:text-white whitespace-nowrap">${formatRupiah(data.kategori[key])}</td>
        </tr>`;
    });
  }

  const filterBln = parseInt(document.getElementById('filterBulan').value);
  const filterThn = parseInt(document.getElementById('filterTahun').value);
  let txFilterBulanIni = masterDataRiwayat.filter(t => {
    let d = new Date(t.tanggal);
    return (d.getMonth() + 1) === filterBln && d.getFullYear() === filterThn;
  });

  if(katKeys.length > 0) {
    let maxKat = katKeys[0];
    let maxKatAmt = data.kategori[maxKat];
    let maxKatPct = data.totalPengeluaran > 0 ? Math.round((maxKatAmt / data.totalPengeluaran) * 100) : 0;
    document.getElementById('bentoKategoriNama').innerText = maxKat;
    document.getElementById('bentoKategoriAngka').innerText = `${formatRupiah(maxKatAmt)} (${maxKatPct}% dari total)`;
  } else {
    document.getElementById('bentoKategoriNama').innerText = "Belum ada data";
    document.getElementById('bentoKategoriAngka').innerText = "Rp0 (0%)";
  }

  if (txFilterBulanIni.length > 0) {
    let maxTx = txFilterBulanIni.reduce((max, t) => t.jumlah > max.jumlah ? t : max, txFilterBulanIni[0]);
    document.getElementById('bentoTxAngka').innerText = formatRupiah(maxTx.jumlah);
    document.getElementById('bentoTxKet').innerText = maxTx.keterangan ? `${maxTx.kategori} (${maxTx.keterangan})` : maxTx.kategori;

    let akumulasiHari = {};
    txFilterBulanIni.forEach(t => { akumulasiHari[t.tanggal] = (akumulasiHari[t.tanggal] || 0) + t.jumlah; });
    let maxHariStr = Object.keys(akumulasiHari).reduce((max, h) => akumulasiHari[h] > akumulasiHari[max] ? h : max, Object.keys(akumulasiHari)[0]);
    let dObj = new Date(maxHariStr);
    document.getElementById('bentoHariTanggal').innerText = dObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' });
    document.getElementById('bentoHariAngka').innerText = formatRupiah(akumulasiHari[maxHariStr]);

    let rerata = data.totalPengeluaran / txFilterBulanIni.length;
    document.getElementById('bentoRerataAngka').innerText = `${formatRupiah(rerata)} / Tx`;
  } else {
    document.getElementById('bentoTxAngka').innerText = "Rp0";
    document.getElementById('bentoTxKet').innerText = "Tidak ada records";
    document.getElementById('bentoHariTanggal').innerText = "-";
    document.getElementById('bentoHariAngka').innerText = "Rp0";
    document.getElementById('bentoRerataAngka').innerText = "Rp0";
  }

  document.getElementById('compMainTotal').innerText = formatRupiah(data.totalPengeluaran);
  let MoMChangeNominal = data.totalPengeluaran - data.totalPengeluaranBulanLalu;
  let MoMChangePct = data.totalPengeluaranBulanLalu > 0 ? (MoMChangeNominal / data.totalPengeluaranBulanLalu) * 100 : 0;
  let performaBudgetVariance = data.budget - data.totalPengeluaran;
  let performaVariancePct = data.budget > 0 ? (performaBudgetVariance / data.budget) * 100 : 0;

  let descTextScorecard = "";
  if (MoMChangeNominal >= 0) { descTextScorecard = `Terdapat peningkatan pengeluaran sebesar ${formatRupiah(MoMChangeNominal)} (${MoMChangePct.toFixed(1)}%) dibandingkan bulan lalu. `; } 
  else { descTextScorecard = `Pengeluaran berhasil ditekan sebesar ${formatRupiah(Math.abs(MoMChangeNominal))} (${Math.abs(MoMChangePct).toFixed(1)}%) lebih hemat dari bulan lalu. `; }
  descTextScorecard += `Selisih performa anggaran sisa saat ini tercatat berada di angka ${performaBudgetVariance >= 0 ? '+' : ''}${formatRupiah(performaBudgetVariance)} (${Math.abs(performaVariancePct).toFixed(1)}%).`;
  document.getElementById('compMainDesc').innerText = descTextScorecard;

  const tbodyComp = document.getElementById('tabelPerbandingan');
  tbodyComp.innerHTML = '';
  let allCategoriesSet = new Set([...Object.keys(data.kategori), ...Object.keys(data.kategoriBulanLalu || {})]);
  
  let topNaikKat = "-", topNaikAmt = 0, topNaikPct = 0;
  let topTurunKat = "-", topTurunAmt = 0, topTurunPct = 0;

  allCategoriesSet.forEach(cat => {
    let biayaLalu = (data.kategoriBulanLalu && data.kategoriBulanLalu[cat]) ? data.kategoriBulanLalu[cat] : 0;
    let biayaIni = data.kategori[cat] ? data.kategori[cat] : 0;
    let diff = biayaIni - biayaLalu;
    let pct = biayaLalu > 0 ? (diff / biayaLalu) * 100 : 100;

    if (diff > 0 && diff > topNaikAmt) { topNaikAmt = diff; topNaikKat = cat; topNaikPct = pct; } 
    else if (diff < 0 && Math.abs(diff) > topTurunAmt) { topTurunAmt = Math.abs(diff); topTurunKat = cat; topTurunPct = Math.abs(pct); }

    let nominalDiff = Math.abs(diff);
    let textPerubahan = '', classStyle = '';
    if (biayaLalu > 0) {
      if (diff > 0) {
        textPerubahan = `↑ ${formatRupiah(nominalDiff)} (${pct.toFixed(1)}%)`;
        classStyle = "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-100 dark:border-red-900/50";
      } else if (diff < 0) {
        textPerubahan = `↓ ${formatRupiah(nominalDiff)} (${Math.abs(pct).toFixed(1)}%)`;
        classStyle = "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50";
      } else {
        textPerubahan = `═ Rp0 (0.0%)`;
        classStyle = "bg-slate-50 text-slate-500 dark:bg-slate-700 dark:text-slate-400 border border-slate-100 dark:border-slate-600";
      }
    } else {
      textPerubahan = `↑ ${formatRupiah(nominalDiff)} (100%)`;
      classStyle = "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50";
    }

    tbodyComp.innerHTML += `
      <tr class="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors">
        <td class="p-2 font-bold text-slate-700 dark:text-slate-300">${cat}</td>
        <td class="p-2 text-right font-semibold text-slate-500 dark:text-slate-400">${formatRupiah(biayaLalu)}</td>
        <td class="p-2 text-right font-black text-slate-800 dark:text-white">${formatRupiah(biayaIni)}</td>
        <td class="p-2 text-center"><span class="px-2 py-0.5 rounded-md text-[10px] font-extrabold ${classStyle}">${textPerubahan}</span></td>
      </tr>`;
  });

  document.getElementById('compTopNaik').innerHTML = topNaikKat !== "-" ? `📈 <b>Peningkatan Tertinggi:</b> Kategori <span class="font-bold text-red-500">${topNaikKat}</span> melambung sebesar +${formatRupiah(topNaikAmt)} (${topNaikPct.toFixed(1)}%).` : `📈 <b>Peningkatan Tertinggi:</b> Tidak ada pembengkakan pos.`;
  document.getElementById('compTopTurun').innerHTML = topTurunKat !== "-" ? `📉 <b>Penghematan Terbaik:</b> Kategori <span class="font-bold text-emerald-500">${topTurunKat}</span> berhasil ditekan sebesar -${formatRupiah(topTurunAmt)} (${topTurunPct.toFixed(1)}%).` : `📉 <b>Penghematan Terbaik:</b> Belum ada pos yang diturunkan.`;

  let hChange = data.totalHarleyBulanLalu > 0 ? ((data.totalHarley - data.totalHarleyBulanLalu) / data.totalHarleyBulanLalu) * 100 : 0;
  let rChange = data.totalRachelBulanLalu > 0 ? ((data.totalRachel - data.totalRachelBulanLalu) / data.totalRachelBulanLalu) * 100 : 0;
  document.getElementById('compUserH').innerHTML = `${formatRupiah(data.totalHarley)} <span class="${hChange >= 0 ? 'text-red-500' : 'text-emerald-500'} font-bold">${hChange >= 0 ? '↑' : '↓'} ${Math.abs(hChange).toFixed(1)}%</span>`;
  document.getElementById('compUserR').innerHTML = `${formatRupiah(data.totalRachel)} <span class="${rChange >= 0 ? 'text-red-500' : 'text-emerald-500'} font-bold">${rChange >= 0 ? '↑' : '↓'} ${Math.abs(rChange).toFixed(1)}%</span>`;

  updateCharts(data, pctH, pctR, allCategoriesSet);
}

function cetakTabelRiwayat(dataArray) {
  const tbody = document.getElementById('tabelRiwayat'); tbody.innerHTML = '';
  if(!dataArray || dataArray.length === 0) { tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-slate-400 dark:text-slate-500 font-medium">Tidak ada transaksi ditemukan</td></tr>`; return; }
  
  dataArray.forEach(t => {
    let color = t.user === 'Harley' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' : 'bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400';
    let escapedKet = (t.keterangan || '').replace(/'/g, "\\'").replace(/"/g, '\\"');
    
    tbody.innerHTML += `
      <tr class="border-b border-slate-100 dark:border-slate-700/40 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
        <td class="p-2 whitespace-nowrap dark:text-slate-300">${t.tanggal}</td>
        <td class="p-2"><span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${color}">${t.user}</span></td>
        <td class="p-2 font-semibold dark:text-slate-200">${t.kategori}</td>
        <td class="p-2 dark:text-slate-300 font-medium"><span class="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-700/80 font-bold text-slate-600 dark:text-slate-300">${t.metode || 'Cash'}</span></td>
        <td class="p-2 text-slate-400 dark:text-slate-400 max-w-[140px] truncate">${t.keterangan || '-'}</td>
        <td class="p-2 text-right font-bold text-slate-800 dark:text-white whitespace-nowrap">${formatRupiah(t.jumlah)}</td>
        <td class="p-2 text-center space-x-2 whitespace-nowrap">
          <button onclick="siapkanEdit('${t.id}', '${t.tanggal}', '${t.user}', '${t.kategori}', ${t.jumlah}, '${escapedKet}', '${t.metode || 'Cash'}')" class="cursor-pointer inline-flex items-center justify-center w-7 h-7 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white dark:text-blue-400 dark:hover:text-white rounded-lg transition-all active:scale-90" title="Sunting">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
          </button>
          <button onclick="hapusTransaksi('${t.id}')" class="cursor-pointer inline-flex items-center justify-center w-7 h-7 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white dark:text-red-400 dark:hover:text-white rounded-lg transition-all active:scale-90" title="Hapus">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
          </button>
        </td>
      </tr>`;
  });
}

function aplikasikanFilterHistori() {
  const mulai = document.getElementById('filterHistoriMulai').value;
  const selesai = document.getElementById('filterHistoriSelesai').value;
  const q = document.getElementById('searchHistori').value.toLowerCase().trim();
  let hasilFilter = masterDataRiwayat;
  if(mulai) hasilFilter = hasilFilter.filter(t => t.tanggal >= mulai);
  if(selesai) hasilFilter = hasilFilter.filter(t => t.tanggal <= selesai);
  if(q) { 
    hasilFilter = hasilFilter.filter(t => t.user.toLowerCase().includes(q) || t.kategori.toLowerCase().includes(q) || (t.metode && t.metode.toLowerCase().includes(q)) || (t.keterangan && t.keterangan.toLowerCase().includes(q))); 
  }
  cetakTabelRiwayat(hasilFilter);
}

function clearFilterHistori() { 
  document.getElementById('searchHistori').value = ''; 
  document.getElementById('filterHistoriMulai').value = ''; 
  document.getElementById('filterHistoriSelesai').value = ''; 
  cetakTabelRiwayat(masterDataRiwayat); 
}

function siapkanEdit(id, tanggal, user, kategori, jumlah, keterangan, metode) {
  editModeId = id;
  document.getElementById('judulForm').innerText = "✏️ Sunting Transaksi";
  document.getElementById('btnSimpan').innerText = "✏️ Perbarui Transaksi";
  document.getElementById('btnSimpan').className = "w-full bg-blue-600 text-white py-2 rounded-xl font-bold text-xs shadow-md hover:bg-blue-700 transition";
  document.getElementById('btnBatalEdit').classList.remove('hidden');
  document.getElementById('inputTanggal').value = tanggal;
  document.getElementById('inputKategori').value = kategori;
  document.getElementById('inputJumlah').value = new Intl.NumberFormat('id-ID').format(jumlah);
  document.getElementById('inputKeterangan').value = keterangan;
  document.getElementById('inputMetode').value = metode || 'Cash';
  if(user === 'Harley') document.getElementById('radioHarley').checked = true; else document.getElementById('radioRachel').checked = true;
  switchTab('input');
}

function resetFormState() {
  editModeId = null;
  document.getElementById('judulForm').innerText = "📌 Catatan Baru";
  document.getElementById('btnSimpan').innerText = "🚀 Simpan Transaksi";
  document.getElementById('btnSimpan').className = "w-full bg-slate-950 text-white dark:bg-white dark:text-slate-900 py-2 rounded-xl font-bold text-xs shadow-md hover:bg-slate-800 dark:hover:bg-slate-100 transition";
  document.getElementById('btnBatalEdit').className = "hidden w-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 py-2 rounded-xl font-bold text-xs transition";
  document.getElementById('inputJumlah').value = ''; document.getElementById('inputKeterangan').value = ''; document.getElementById('inputTanggal').value = new Date().toISOString().split('T')[0];
}

function submitTransaksi(event) {
  event.preventDefault();
  const btn = document.getElementById('btnSimpan'); btn.disabled = true; btn.innerText = "⏳ Memproses...";
  const cleanJumlah = document.getElementById('inputJumlah').value.replace(/\./g, '');
  const bln = document.getElementById('filterBulan').value;
  const thn = document.getElementById('filterTahun').value;

  const formData = { 
    user: document.querySelector('input[name="user"]:checked').value, 
    tanggal: document.getElementById('inputTanggal').value, 
    kategori: document.getElementById('inputKategori').value, 
    jumlah: cleanJumlah, 
    keterangan: document.getElementById('inputKeterangan').value, 
    metode: document.getElementById('inputMetode').value 
  };
  
  const localTx = {
    id: editModeId || ("tmp_" + Date.now()),
    tanggal: formData.tanggal,
    user: formData.user,
    kategori: formData.kategori,
    jumlah: parseInt(formData.jumlah),
    keterangan: formData.keterangan,
    metode: formData.metode
  };
  
  if (editModeId) {
    masterDataRiwayat = masterDataRiwayat.map(t => (String(t.id) === String(editModeId)) ? localTx : t);
  } else {
    masterDataRiwayat.unshift(localTx);
  }
  
  cetakTabelRiwayat(masterDataRiwayat);
  aplikasikanFilterHistori();
  
  fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: editModeId ? 'editTransaction' : 'addTransaction', id: editModeId, formData: formData }) })
  .then(res => res.json())
  .then(res => { 
    btn.disabled = false; 
    btn.innerText = "🚀 Simpan Transaksi";
    if(res.success) { 
      showToast(res.message, "✅"); 
      resetFormState(); 
      setTimeout(() => { initializeApplicationData(bln, thn); }, 1000);
    } else { 
      showToast(res.message, "❌"); 
    } 
  })
  .catch((err) => { 
    console.error(err);
    btn.disabled = false; 
    btn.innerText = "🚀 Simpan Transaksi";
    showToast("Koneksi Internet Terganggu", "❌"); 
  });
}

function hapusTransaksi(id) {
  if(!confirm("Apakah Anda yakin ingin menghapus catatan transaksi ini?")) return;
  
  showToast("Sedang menghapus...", "⏳");
  const bln = document.getElementById('filterBulan').value;
  const thn = document.getElementById('filterTahun').value;
  
  masterDataRiwayat = masterDataRiwayat.filter(t => String(t.id) !== String(id));
  cetakTabelRiwayat(masterDataRiwayat);
  aplikasikanFilterHistori();

  const targetPayload = { 
    action: 'deleteTransaction', 
    id: id,
    rowId: id,
    uid: id,
    idNum: isNaN(id) ? id : Number(id)
  };
  
  fetch(API_URL, { method: 'POST', body: JSON.stringify(targetPayload) })
  .then(res => res.json())
  .then(res => { 
    if(res.success) { 
      showToast(res.message, "✅"); 
      setTimeout(() => { initializeApplicationData(bln, thn); }, 1000);
    } else { 
      showToast(res.message, "❌"); 
      initializeApplicationData(bln, thn); 
    } 
  })
  .catch((err) => {
    console.error(err);
    showToast("Gagal Terhubung ke Cloud", "❌");
    initializeApplicationData(bln, thn);
  });
}

function renderCategoriesManagement(list) {
  const listDiv = document.getElementById('listKategoriKustom');
  if (!listDiv) return;
  listDiv.innerHTML = '';
  list.forEach(k => {
    listDiv.innerHTML += `
      <span class="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 px-2 py-1 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 shadow-xs">
        ${k}
        <button type="button" onclick="deleteManualCategory('${k}')" class="text-red-500 hover:text-red-700 ml-0.5 font-black cursor-pointer text-[11px]">✕</button>
      </span>`;
  });
}

function saveManualCategory() {
  const name = document.getElementById('inputKategoriBaru').value.trim();
  if(!name) { showToast("Masukkan nama kategori valid!", "❌"); return; }
  fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'addCategory', kategori: name }) })
  .then(res => res.json())
  .then(res => {
    if(res.success) {
      showToast(res.message, "✅");
      document.getElementById('inputKategoriBaru').value = '';
      const bln = document.getElementById('filterBulan').value;
      const thn = document.getElementById('filterTahun').value;
      initializeApplicationData(bln, thn); 
    } else { showToast(res.message, "❌"); }
  });
}

function deleteManualCategory(kategori) {
  if(!confirm(`Hapus kategori "${kategori}"?\nTransaksi lama yang menggunakan kategori ini tidak akan hilang dari riwayat.`)) return;
  fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteCategory', kategori: kategori }) })
  .then(res => res.json())
  .then(res => {
    if(res.success) { 
      showToast(res.message, "✅"); 
      const bln = document.getElementById('filterBulan').value;
      const thn = document.getElementById('filterTahun').value;
      initializeApplicationData(bln, thn);
    } else { showToast(res.message, "❌"); }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  updateDarkModeButton(document.documentElement.classList.contains('dark'));
  
  document.getElementById('inputTanggal').value = new Date().toISOString().split('T')[0];

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  document.getElementById('filterBulan').value = currentMonth;
  
  initializeApplicationData(currentMonth, currentYear);

  const inputJumlah = document.getElementById('inputJumlah');
  if (inputJumlah) {
    inputJumlah.addEventListener('input', function() {
      let nilaiMurni = this.value.replace(/\D/g, ''); 
      this.value = nilaiMurni ? new Intl.NumberFormat('id-ID').format(nilaiMurni) : ''; 
    });
  }
});
