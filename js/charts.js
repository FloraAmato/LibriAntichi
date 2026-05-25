'use strict';

let chartCanvas = null;
let chartCtx   = null;

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
  const dpr = window.devicePixelRatio || 1;
  chartCanvas.style.width  = w + 'px';
  chartCanvas.style.height = '320px';
  chartCanvas.width  = w * dpr;
  chartCanvas.height = 320 * dpr;
  chartCtx.scale(dpr, dpr);
}

function drawDegradationChart(data, currentYear, materialId) {
  if (!chartCtx || !chartCanvas) return;

  const W = chartCanvas.width  / (window.devicePixelRatio || 1);
  const H = chartCanvas.height / (window.devicePixelRatio || 1);
  const pad = { top: 36, right: 28, bottom: 54, left: 64 };
  const pw = W - pad.left - pad.right;
  const ph = H - pad.top  - pad.bottom;
  const maxYear = data[data.length - 1].year || 200;

  const ctx = chartCtx;
  ctx.save();

  // Background
  ctx.fillStyle = '#12100C';
  ctx.fillRect(0, 0, W, H);

  // Danger zone fills
  const zones = [
    { from: 0,  to: 20, color: 'rgba(60,120,40,0.08)' },
    { from: 20, to: 45, color: 'rgba(180,140,20,0.08)' },
    { from: 45, to: 65, color: 'rgba(200,80,20,0.10)' },
    { from: 65, to: 100,color: 'rgba(160,20,20,0.12)' }
  ];
  zones.forEach(z => {
    const y1 = pad.top + ph - (z.to  / 100) * ph;
    const y2 = pad.top + ph - (z.from / 100) * ph;
    ctx.fillStyle = z.color;
    ctx.fillRect(pad.left, y1, pw, y2 - y1);
  });

  // Grid lines
  ctx.strokeStyle = 'rgba(180,140,60,0.1)';
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i++) {
    const y = pad.top + ph - (i / 4) * ph;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + pw, y); ctx.stroke();
    ctx.fillStyle = 'rgba(210,170,80,0.65)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${i * 25}%`, pad.left - 8, y + 4);
  }

  const numV = 5;
  for (let i = 0; i <= numV; i++) {
    const x = pad.left + (i / numV) * pw;
    const yr = Math.round((i / numV) * maxYear);
    ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + ph); ctx.stroke();
    ctx.fillStyle = 'rgba(210,170,80,0.65)';
    ctx.textAlign = 'center';
    ctx.font = '11px sans-serif';
    ctx.fillText(`${yr} a`, x, pad.top + ph + 18);
  }

  // Axis labels
  ctx.fillStyle = 'rgba(210,170,80,0.75)';
  ctx.font = '12px Georgia,serif';
  ctx.textAlign = 'center';
  ctx.fillText('Anni di conservazione', pad.left + pw / 2, H - 6);
  ctx.save();
  ctx.translate(16, pad.top + ph / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Degrado %', 0, 0);
  ctx.restore();

  // Lines to draw
  const lines = [
    { key: 'structural',  color: '#5A9AFF', width: 1.8, label: 'Struttura',    dash: [4, 2] },
    { key: 'legibility',  color: '#50E878', width: 1.8, label: 'Leggibilità',  dash: [4, 2] },
    { key: 'decoration',  color: '#FF7878', width: 1.8, label: 'Decorazioni',  dash: [4, 2] },
    { key: 'score',       color: '#F0C040', width: 3.2, label: 'Degrado Tot.', dash: [] }
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
  grad.addColorStop(0,   'rgba(240,192,64,0.18)');
  grad.addColorStop(0.7, 'rgba(240,192,64,0.04)');
  grad.addColorStop(1,   'rgba(240,192,64,0)');
  ctx.fillStyle = grad;
  ctx.fill();

  // Threshold milestone dots
  [25, 50, 75].forEach(thresh => {
    const pt = data.find(p => p.score >= thresh);
    if (!pt || pt.year === 0) return;
    const x = pad.left + (pt.year / maxYear) * pw;
    const y = pad.top  + ph - (thresh / 100) * ph;
    const col = thresh < 50 ? '#FFC107' : thresh < 75 ? '#FF9800' : '#F44336';

    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.strokeStyle = '#12100C';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (x + 75 < W) {
      ctx.fillStyle = col;
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${pt.year}a → ${thresh}%`, x + 8, y - 5);
    }
  });

  // Current year marker
  if (currentYear > 0 && currentYear <= maxYear) {
    const cx = pad.left + (currentYear / maxYear) * pw;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, pad.top);
    ctx.lineTo(cx, pad.top + ph);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = 'bold 11px sans-serif';
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
    ctx.fillStyle = 'rgba(220,190,100,0.80)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(ln.label, lx + 28, ly + 4);
  });

  ctx.restore();
}
