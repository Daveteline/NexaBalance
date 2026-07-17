// Mengatur tombol teks Dark Mode
function updateDarkModeButton(isDark) {
  document.getElementById('btnDarkMode').innerText = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
}

// Menampilkan Toast Alert Premium
function showToast(msg, icon = "💡") {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  const toastIcon = document.getElementById('toastIcon');
  
  if (!toast || !toastMessage || !toastIcon) {
    console.log(`${icon} ${msg}`);
    return;
  }
  
  toastMessage.innerText = msg;
  toastIcon.innerText = icon;
  
  toast.className = "fixed top-5 right-5 z-[9999] transform translate-y-0 opacity-100 transition-all duration-300 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-5 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-sm font-semibold animate-pulse";
  
  setTimeout(() => { 
    if (toast) {
      toast.className = "fixed top-5 right-5 z-[9999] transform translate-y-[-120px] opacity-0 transition-all duration-300 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-5 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-sm font-semibold pointer-events-none"; 
    }
  }, 3000);
}

// Navigasi Perpindahan Tab
function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.getElementById(`tab-${tabName}`).classList.add('active');
  const listTabs = ['dashboard', 'comparison', 'input', 'budget'];
  listTabs.forEach(t => {
    const btn = document.getElementById(`btn-tab-${t}`);
    if(t === tabName) { 
      btn.className = "px-3 py-2 rounded-lg text-xs font-bold transition-all bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs"; 
    } else { 
      btn.className = "px-3 py-2 rounded-lg text-xs font-bold transition-all text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"; 
    }
  });
}

// Dropdown Buka/Tutup Kelola Kategori
function toggleKategoriList() {
  const wrapper = document.getElementById('listKategoriKustomWrapper');
  const arrow = document.getElementById('arrowKategori');
  if (wrapper.classList.contains('hidden')) {
    wrapper.classList.remove('hidden');
    arrow.innerText = '▼';
  } else {
    wrapper.classList.add('hidden');
    arrow.innerText = '▶';
  }
}

// Buka Menu Mobile (Burger)
function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  const icon = document.getElementById('burgerIcon');
  const isHidden = menu.classList.contains('hidden');
  
  if (isHidden) {
    menu.classList.remove('hidden');
    menu.classList.add('flex');
    icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>';
  } else {
    menu.classList.add('hidden');
    menu.classList.remove('flex');
    icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 12h16M4 18h16"/>';
  }
}

// Tutup Menu Mobile otomatis setelah klik
function closeMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  const icon = document.getElementById('burgerIcon');
  if (window.innerWidth < 1024) {
    menu.classList.add('hidden');
    menu.classList.remove('flex');
    icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 12h16M4 18h16"/>';
  }
}
