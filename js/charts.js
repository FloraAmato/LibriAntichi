'use strict';

let chartCanvas = null;
let chartCtx   = null;
// Remember the latest draw so the chart can repaint itself after resize
// (setting canvas.width clears all pixels, leaving an empty white box).
let _lastData = null;
let _lastYear = 0;
let _lastMat  = null;

function initChart(canvasId) {
  chartCanvas = document.getElementById(canvasId);
  if (!chartCanvas) return;
  chartCtx = chartCanvas.getContext('2d');
  new ResizeObserver(resizeCanvas).observe(chartCanvas.parentElement);
  resizeCanvas();
}

function resizeCanvas() {
  if (!chartCanvas) return;
  const w = chartCanvas.parentElement.clientWidth;
  if (w <= 0) return;             // wait until layout is ready
  const dpr = window.devicePixelRatio || 1;
  chartCanvas.style.width  = w + 'px';
  chartCanvas.style.height = '320px';
  chartCanvas.width  = w * dpr;   // this clears the canvas + resets transform
  chartCanvas.height = 320 * dpr;
  chartCtx.setTransform(1, 0, 0, 1, 0, 0);
  chartCtx.scale(dpr, dpr);
  // Repaint with the most recent data if any, otherwise paint an empty axes
  if (_lastData) drawDegradationChart(_lastData, _lastYear, _lastMat);
  else paintEmptyChart();
}

function paintEmptyChart() {
  if (!chartCtx || !chartCanvas) return;
  const W = chartCanvas.width  / (window.devicePixelRatio || 1);
  const H = chartCanvas.height / (window.devicePixelRatio || 1);
  chartCtx.fillStyle = '#F8F6F4';
  chartCtx.fillRect(0, 0, W, H);
}

function drawDegradationChart(data, currentYear, materialId) {
  if (!chartCtx || !chartCanvas) return;
  // Cache for redraw on resize
  _lastData = data; _lastYear = currentYear; _lastMat = materialId;

  const W = chartCanvas.width  / (window.devicePixelRatio || 1);
  const H = chartCanvas.height / (window.devicePixelRatio || 1);
  const pad = { top: 36, right: 28, bottom: 54, left: 64 };
  const pw = W - pad.left - pad.right;
  const ph = H - pad.top  - pad.bottom;
  const maxYear = data[data.length - 1].year || 200;

  const ctx = chartCtx;
  ctx.save();

  // Background (VoH light theme)
  ctx.fillStyle = '#F8F6F4';
  ctx.fillRect(0, 0, W, H);

  // Danger zone fills (soft tints)
  const zones = [
    { from: 0,  to: 20,  color: 'rgba(91,138,74,0.08)'  },
    { from: 20, to: 45,  color: 'rgba(198,138,42,0.10)' },
    { from: 45, to: 65,  color: 'rgba(200,80,40,0.10)'  },
    { from: 65, to: 100, color: 'rgba(168,37,62,0.12)'  }
  ];
  zones.forEach(z => {
    const y1 = pad.top + ph - (z.to  / 100) * ph;
    const y2 = pad.top + ph - (z.from / 100) * ph;
    ctx.fillStyle = z.color;
    ctx.fillRect(pad.left, y1, pw, y2 - y1);
  });

  // Grid lines (light, subtle)
  ctx.strokeStyle = 'rgba(168,37,62,0.10)';
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i++) {
    const y = pad.top + ph - (i / 4) * ph;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + pw, y); ctx.stroke();
    ctx.fillStyle = '#5A5A5A';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${i * 25}%`, pad.left - 8, y + 4);
  }

  const numV = 5;
  for (let i = 0; i <= numV; i++) {
    const x = pad.left + (i / numV) * pw;
    const yr = Math.round((i / numV) * maxYear);
    ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + ph); ctx.stroke();
    ctx.fillStyle = '#5A5A5A';
    ctx.textAlign = 'center';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText(`${yr} a`, x, pad.top + ph + 18);
  }

  // Axis labels
  ctx.fillStyle = '#1F1F1F';
  ctx.font = '600 12px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Anni di conservazione', pad.left + pw / 2, H - 6);
  ctx.save();
  ctx.translate(16, pad.top + ph / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Degrado %', 0, 0);
  ctx.restore();

  // Lines (VoH palette)
  const lines = [
    { key: 'structural',  color: '#3B73B8', width: 1.8, label: 'Struttura',    dash: [4, 3] },
    { key: 'legibility',  color: '#5B8A4A', width: 1.8, label: 'Leggibilità',  dash: [4, 3] },
    { key: 'decoration',  color: '#C68A2A', width: 1.8, label: 'Decorazioni',  dash: [4, 3] },
    { key: 'score',       color: '#A8253E', width: 3.2, label: 'Degrado Tot.', dash: [] }
  ];

  lines.forEach(line => {
    ctx.beginPath();
    ctx.setLineDash(line.dash);
    ctx.strokeStyle = line.color;
    ctx.lineWidth   = line.width;
    ctx.lineJoin    = 'round';
    ctx.lineCap     = 'round';

    data.forEach((pt, i) => {
      const x = pad.left + (pt.year / maxYear) * pw;
      const val = line.key === 'score' ? pt.score : (100 - pt[line.key]);
      const y   = pad.top  + ph - (val / 100) * ph;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // Filled area under total degradation curve (subtle)
  ctx.beginPath();
  data.forEach((pt, i) => {
    const x = pad.left + (pt.year / maxYear) * pw;
    const y = pad.top  + ph - (pt.score / 100) * ph;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.lineTo(pad.left + pw, pad.top + ph);
  ctx.lineTo(pad.left, pad.top + ph);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ph);
  grad.addColorStop(0,   'rgba(168,37,62,0.18)');
  grad.addColorStop(0.7, 'rgba(168,37,62,0.04)');
  grad.addColorStop(1,   'rgba(168,37,62,0)');
  ctx.fillStyle = grad;
  ctx.fill();

  // Threshold milestone dots
  [25, 50, 75].forEach(thresh => {
    const pt = data.find(p => p.score >= thresh);
    if (!pt || pt.year === 0) return;
    const x = pad.left + (pt.year / maxYear) * pw;
    const y = pad.top  + ph - (thresh / 100) * ph;
    const col = thresh < 50 ? '#C68A2A' : thresh < 75 ? '#D8602A' : '#A8253E';

    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (x + 75 < W) {
      ctx.fillStyle = col;
      ctx.font = '600 10px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${pt.year}a → ${thresh}%`, x + 8, y - 7);
    }
  });

  // Current year marker
  if (currentYear > 0 && currentYear <= maxYear) {
    const cx = pad.left + (currentYear / maxYear) * pw;
    ctx.strokeStyle = '#A8253E';
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, pad.top);
    ctx.lineTo(cx, pad.top + ph);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#A8253E';
    ctx.font = '600 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Anno ${currentYear}`, cx, pad.top - 10);
  }

  // Legend
  const legX = pad.left + pw - 160;
  const legY = pad.top + 14;
  lines.forEach((ln, i) => {
    const lx = legX;
    const ly = legY + i * 20;
    ctx.strokeStyle = ln.color;
    ctx.lineWidth   = ln.width;
    ctx.setLineDash(ln.dash);
    ctx.beginPath();
    ctx.moveTo(lx, ly); ctx.lineTo(lx + 22, ly);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#1F1F1F';
    ctx.font = '500 11px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(ln.label, lx + 28, ly + 4);
  });

  ctx.restore();
}
