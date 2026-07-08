const canvas = document.getElementById("network-canvas");
const ctx = canvas.getContext("2d");

let width = 0;
let height = 0;
let dpr = 1;
const points = Array.from({ length: 34 }, (_, index) => ({
  x: Math.random(),
  y: Math.random(),
  r: 1.5 + Math.random() * 2.8,
  speed: 0.00045 + Math.random() * 0.0012,
  phase: Math.random() * Math.PI * 2,
  tone: index % 4
}));

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function color(tone) {
  if (tone === 0) return "#238dff";
  if (tone === 1) return "#2bd3ff";
  if (tone === 2) return "#7367ff";
  return "#32e57e";
}

function draw(time) {
  ctx.clearRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#050711");
  gradient.addColorStop(0.5, "#080a18");
  gradient.addColorStop(1, "#071420");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const live = points.map((point) => {
    const drift = time * point.speed;
    return {
      ...point,
      px: ((point.x + drift) % 1) * width,
      py: point.y * height + Math.sin(time * 0.001 + point.phase) * 34
    };
  });

  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const a = live[i];
      const b = live[j];
      const dx = a.px - b.px;
      const dy = a.py - b.py;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 190) {
        ctx.globalAlpha = (1 - distance / 190) * 0.18;
        ctx.strokeStyle = color(a.tone);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.px, a.py);
        ctx.lineTo(b.px, b.py);
        ctx.stroke();
      }
    }
  }

  ctx.globalAlpha = 1;
  live.forEach((point) => {
    const c = color(point.tone);
    ctx.beginPath();
    ctx.arc(point.px, point.py, point.r, 0, Math.PI * 2);
    ctx.fillStyle = c;
    ctx.shadowColor = c;
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  requestAnimationFrame(draw);
}

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(draw);

const reportForm = document.getElementById("beta-report-form");
const reportStatus = document.getElementById("report-form-status");

if (reportForm) {
  reportForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = reportForm.querySelector("button[type='submit']");
    const formData = new FormData(reportForm);
    const payload = Object.fromEntries(formData.entries());
    payload.source = "regent-beta-site";

    if (submit) {
      submit.disabled = true;
      submit.textContent = "Отправляю...";
    }
    setReportStatus("Отправляю результат теста...", "info");

    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const raw = await response.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = { error: raw.slice(0, 240) };
      }
      if (!response.ok || data.ok === false) {
        const reason = data.error || response.statusText || "Не удалось отправить отчет.";
        throw new Error(`HTTP ${response.status}: ${reason}`);
      }
      reportForm.reset();
      setReportStatus("Готово. Результат отправлен разработчику в Telegram.", "ok");
    } catch (error) {
      setReportStatus(`Не отправилось: ${error.message}. Напиши разработчику напрямую и приложи отчет из приложения.`, "error");
    } finally {
      if (submit) {
        submit.disabled = false;
        submit.textContent = "Отправить результат";
      }
    }
  });
}

function setReportStatus(text, tone) {
  if (!reportStatus) return;
  reportStatus.textContent = text;
  reportStatus.dataset.tone = tone;
}
