// Registrasi DataLabels untuk teks persentase di dalam Donut Chart
Chart.register(ChartDataLabels);

let chartKontribusiInstance, chartKategoriInstance, chartMingguanInstance, chartPerbandinganBarInstance;

function updateCharts(data, pctH, pctR, allCategoriesSet) {
  if(chartKontribusiInstance) chartKontribusiInstance.destroy();
  if(chartKategoriInstance) chartKategoriInstance.destroy();
  if(chartMingguanInstance) chartMingguanInstance.destroy();
  if(chartPerbandinganBarInstance) chartPerbandinganBarInstance.destroy();

  const isDark = document.documentElement.classList.contains('dark');
  const textChartColor = isDark ? '#f1f5f9' : '#334155';
  const lineChartColor = isDark ? '#334155' : '#e2e8f0';

  // 1. Chart Kontribusi Anggaran
  chartKontribusiInstance = new Chart(document.getElementById('chartKontribusi'), {
    type: 'doughnut',
    data: { labels: ['Harley', 'Rachel'], datasets: [{ data: [pctH, pctR], backgroundColor: ['#3b82f6', '#ec4899'] }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, datalabels: { color: '#ffffff', font: { weight: 'bold', size: 11 }, formatter: (value) => value > 0 ? value + '%' : '' } } }
  });

  // 2. Chart Distribusi Kategori
  let katLabels = Object.keys(data.kategori).sort((a, b) => data.kategori[b] - data.kategori[a]);
  let katValues = katLabels.map(key => data.kategori[key]);
  chartKategoriInstance = new Chart(document.getElementById('chartKategori'), {
    type: 'doughnut',
    data: { labels: katLabels, datasets: [{ data: katValues, backgroundColor: CHART_COLORS }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, datalabels: { color: '#ffffff', font: { weight: 'bold', size: 10 }, formatter: (value, context) => { const total = context.chart.data.datasets[0].data.reduce((acc, val) => acc + val, 0); const percentage = total > 0 ? Math.round((value / total) * 100) : 0; return percentage > 0 ? percentage + '%' : ''; } } } }
  });

  // 3. Chart Tren Mingguan
  chartMingguanInstance = new Chart(document.getElementById('chartMingguan'), {
    type: 'bar',
    data: { labels: ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4', 'Minggu 5'], datasets: [{ label: 'Harley', data: data.mingguanHarley, backgroundColor: '#3b82f6', borderRadius: 4 }, { label: 'Rachel', data: data.mingguanRachel, backgroundColor: '#ec4899', borderRadius: 4 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { datalabels: { display: false }, legend: { labels: { color: textChartColor } } }, scales: { x: { grid: { color: lineChartColor }, ticks: { color: textChartColor } }, y: { grid: { color: lineChartColor }, ticks: { color: textChartColor } } } }
  });

  // 4. Chart Perbandingan Bulanan (MoM)
  let compLabels = Array.from(allCategoriesSet);
  let datasetLalu = compLabels.map(cat => (data.kategoriBulanLalu && data.kategoriBulanLalu[cat]) ? data.kategoriBulanLalu[cat] : 0);
  let datasetIni = compLabels.map(cat => data.kategori[cat] ? data.kategori[cat] : 0);

  chartPerbandinganBarInstance = new Chart(document.getElementById('chartPerbandinganBar'), {
    type: 'bar',
    data: {
      labels: compLabels,
      datasets: [
        { label: 'Bulan Lalu', data: datasetLalu, backgroundColor: isDark ? '#475569' : '#cbd5e1', borderRadius: 4 },
        { label: 'Bulan Ini', data: datasetIni, backgroundColor: '#3b82f6', borderRadius: 4 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { datalabels: { display: false }, legend: { labels: { color: textChartColor } } },
      scales: {
        x: { grid: { color: lineChartColor }, ticks: { color: textChartColor } },
        y: { grid: { color: lineChartColor }, ticks: { color: textChartColor } }
      }
    }
  });
}
