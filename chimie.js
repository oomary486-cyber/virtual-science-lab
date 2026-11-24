const rotateBtn = document.getElementById("rotateBtn");
const duplicateBtn = document.getElementById("duplicateBtn");
const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");
const resetChemBtn = document.getElementById("resetChemBtn");
const toggleDrawerBtn = document.getElementById("toggleDrawerBtn");
const rightMatPanel = document.getElementById("rightMatPanel");
const chemCanvas = document.getElementById("chemCanvas");
const ctx = chemCanvas.getContext("2d");
const chemStatus = document.getElementById("chemStatus");

const inspectorEl = document.getElementById("chemInspector");
const inspectorTitleEl = document.getElementById("chemInspectorTitle");
const inspectorInfoEl = document.getElementById("chemInspectorInfo");
const inspectorControlsEl = document.getElementById("chemInspectorControls");
const inspectorCloseEl = document.getElementById("chemInspectorClose");

const R = window.LabRender;

let isLit = false;
let limeWaterActive = false;
let turbidity = 0;
let tempC = 22;
let timeTick = 0;
let selectedId = null;
let inspectorOpen = false;
let draggingItem = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

const LIQUID_TYPES = ["beaker", "erlenmeyer", "cylinder", "flask", "testtube", "roundflask", "phmeter"];
const HEAT_TYPES = ["burner", "hotplate"];

const TOOL_SPECS = {
  beaker:      { w: 116, h: 144, name: "Bécher en verre" },
  erlenmeyer:  { w: 126, h: 154, name: "Erlenmeyer" },
  cylinder:    { w: 80,  h: 182, name: "Éprouvette graduée" },
  flask:       { w: 112, h: 170, name: "Fiole jaugée" },
  testtube:    { w: 58,  h: 158, name: "Tube à essai" },
  roundflask:  { w: 122, h: 158, name: "Ballon à fond rond" },
  burner:      { w: 104, h: 156, name: "Bec Bunsen" },
  hotplate:    { w: 140, h: 96,  name: "Plaque chauffante" },
  stand:       { w: 118, h: 202, name: "Statif et pince" },
  thermometer: { w: 70,  h: 182, name: "Thermomètre numérique" },
  phmeter:     { w: 88,  h: 174, name: "pH-mètre numérique" },
  balance:     { w: 140, h: 114, name: "Balance de précision" },
  pipette:     { w: 62,  h: 172, name: "Pipette graduée" },
  stirrer:     { w: 132, h: 100, name: "Agitateur magnétique" }
};

function createDefaultChemItems() {
  return [
    { id: 1, type: "burner", x: 245, y: 310, w: 104, h: 156, angle: 0, liquid: "limewater" },
    { id: 2, type: "erlenmeyer", x: 510, y: 310, w: 126, h: 154, angle: 0, liquid: "limewater" },
    { id: 3, type: "cylinder", x: 740, y: 282, w: 80, h: 182, angle: 0, liquid: "water" },
    { id: 4, type: "thermometer", x: 915, y: 282, w: 70, h: 182, angle: 0, liquid: "water" }
  ];
}

let chemItems = createDefaultChemItems();

function getLiquidStyle(type) {
  switch (type) {
    case "acid":
      return { top: "rgba(248, 113, 113, 0.35)", bot: "rgba(220, 38, 38, 0.55)", ph: "2.0", name: "Acide chlorhydrique (pH 2.0)" };
    case "base":
      return { top: "rgba(96, 165, 250, 0.35)", bot: "rgba(37, 99, 235, 0.58)", ph: "12.5", name: "Soude / Base (pH 12.5)" };
    case "indicator":
      return { top: "rgba(74, 222, 128, 0.36)", bot: "rgba(22, 163, 74, 0.56)", ph: "7.0", name: "Bleu de bromothymol" };
    case "water":
      return { top: "rgba(186, 230, 253, 0.25)", bot: "rgba(56, 189, 248, 0.42)", ph: "7.0", name: "Eau distillée" };
    default: {
      const r = Math.round(140 + 105 * turbidity);
      const g = Math.round(215 + 32 * turbidity);
      const b = Math.round(253 - 2 * turbidity);
      const aTop = 0.28 + turbidity * 0.58;
      const aBot = 0.46 + turbidity * 0.52;
      return {
        top: `rgba(${r}, ${g}, ${b}, ${aTop})`,
        bot: `rgba(${r - 20}, ${g - 15}, ${b - 10}, ${aBot})`,
        ph: turbidity > 0.3 ? "8.3" : "7.4",
        name: turbidity > 0.3 ? "Eau de chaux (trouble)" : "Eau de chaux"
      };
    }
  }
}

function makeLiquidGradient(x, y, h, liq) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, liq.top);
  g.addColorStop(1, liq.bot);
  return g;
}

function renderInspector() {
  const item = chemItems.find((i) => i.id === selectedId);
  if (!item || !inspectorOpen) {
    inspectorEl.classList.remove("active");
    return;
  }

  const spec = TOOL_SPECS[item.type] || { name: item.type };
  const liq = getLiquidStyle(item.liquid || "water");
  inspectorEl.classList.add("active");
  inspectorTitleEl.textContent = spec.name;

  let infoText = `Angle : ${item.angle || 0}°`;
  if (LIQUID_TYPES.includes(item.type)) {
    infoText += `<br>Contenu : ${liq.name} (pH ${liq.ph})`;
  }
  if (HEAT_TYPES.includes(item.type) || item.type === "thermometer") {
    infoText += `<br>Température : ${Math.round(tempC)} °C`;
  }
  if (item.type === "balance") {
    infoText += `<br>Masse : 125.0 g`;
  }
  inspectorInfoEl.innerHTML = infoText;

  inspectorControlsEl.innerHTML = "";

  if (LIQUID_TYPES.includes(item.type)) {
    const lbl = document.createElement("label");
    lbl.textContent = "Liquide / Réactif :";
    const sel = document.createElement("select");
    sel.innerHTML = `
      <option value="limewater">Eau de chaux</option>
      <option value="water">Eau distillée</option>
      <option value="acid">Acide (pH 2.0)</option>
      <option value="base">Base (pH 12.5)</option>
      <option value="indicator">Bleu de bromothymol</option>
    `;
    sel.value = item.liquid || "water";
    sel.addEventListener("change", () => {
      item.liquid = sel.value;
      renderInspector();
    });
    inspectorControlsEl.appendChild(lbl);
    inspectorControlsEl.appendChild(sel);
  }

  if (HEAT_TYPES.includes(item.type)) {
    const flameBtn = document.createElement("button");
    flameBtn.type = "button";
    flameBtn.textContent = isLit ? "Éteindre" : "Allumer";
    flameBtn.addEventListener("click", () => {
      isLit = !isLit;
      if (!isLit) {
        limeWaterActive = false;
        turbidity = 0;
      }
      renderInspector();
    });
    inspectorControlsEl.appendChild(flameBtn);

    if (item.type === "burner") {
      const co2Btn = document.createElement("button");
      co2Btn.type = "button";
      co2Btn.className = "secondary";
      co2Btn.textContent = "Test au CO₂";
      co2Btn.addEventListener("click", () => {
        if (!isLit) {
          chemStatus.style.color = "#fbbf24";
          chemStatus.textContent = "Allumez le brûleur avant de lancer le test au CO₂.";
          return;
        }
        limeWaterActive = true;
      });
      inspectorControlsEl.appendChild(co2Btn);
    }
  }
}

function drawGraduations(x, topY, height, count) {
  ctx.strokeStyle = "rgba(241, 245, 249, 0.58)";
  ctx.lineWidth = 1.1;
  for (let i = 1; i <= count; i++) {
    const gy = topY + (height / (count + 1)) * i;
    const len = i % 2 === 0 ? 13 : 7;
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + len, gy);
    ctx.stroke();
  }
}

function drawBeaker(item) {
  const { x, y, w, h, liquid } = item;
  const cx = x + w / 2;
  const bodyTop = y + 16;
  const bodyH = h - 24;
  const liqTop = bodyTop + Math.round(bodyH * 0.46);
  const liqH = bodyTop + bodyH - liqTop - 3;
  const liq = getLiquidStyle(liquid);

  R.drawShadow(ctx, cx, y + h - 3, w * 0.47);

  ctx.fillStyle = makeLiquidGradient(x + 8, liqTop, liqH, liq);
  ctx.beginPath();
  ctx.roundRect(x + 8, liqTop, w - 16, liqH, [0, 0, 10, 10]);
  ctx.fill();
  R.drawMeniscus(ctx, x + 8, liqTop, w - 16);

  drawGraduations(x + 8, bodyTop + 10, bodyH - 18, 6);
  R.drawGlassSheen(ctx, x + 6, bodyTop, w - 12, bodyH, 10);

  // شفة علوية مائلة للزجاج
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(x + 3, bodyTop);
  ctx.lineTo(x + w - 3, bodyTop);
  ctx.stroke();

  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.roundRect(x + 6, bodyTop, w - 12, bodyH, [2, 2, 12, 12]);
  ctx.stroke();

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "600 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Bécher", cx, y + h + 14);
  ctx.textAlign = "start";
}

function drawErlenmeyer(item) {
  const { x, y, w, h, liquid } = item;
  const cx = x + w / 2;
  const neckTop = y + 12;
  const neckBottom = y + 50;
  const baseBottom = y + h - 8;
  const liq = getLiquidStyle(liquid);

  R.drawShadow(ctx, cx, y + h - 3, w * 0.49);

  ctx.fillStyle = makeLiquidGradient(x + 8, y + 102, baseBottom - (y + 102), liq);
  ctx.beginPath();
  ctx.moveTo(cx - 28, y + 102);
  ctx.lineTo(cx + 28, y + 102);
  ctx.lineTo(x + w - 8, baseBottom - 2);
  ctx.lineTo(x + 8, baseBottom - 2);
  ctx.closePath();
  ctx.fill();
  R.drawMeniscus(ctx, cx - 28, y + 102, 56);

  ctx.beginPath();
  ctx.moveTo(cx - 14, neckTop);
  ctx.lineTo(cx - 14, neckBottom);
  ctx.lineTo(x + 6, baseBottom);
  ctx.quadraticCurveTo(cx, baseBottom + 4, x + w - 6, baseBottom);
  ctx.lineTo(cx + 14, neckBottom);
  ctx.lineTo(cx + 14, neckTop);
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 2.3;
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.09)";
  ctx.fill();

  // شفة العنق
  ctx.strokeStyle = "#f1f5f9";
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(cx - 17, neckTop);
  ctx.lineTo(cx + 17, neckTop);
  ctx.stroke();

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "600 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Erlenmeyer", cx, y + h + 14);
  ctx.textAlign = "start";
}

function drawCylinder(item) {
  const { x, y, w, h, liquid } = item;
  const cx = x + w / 2;
  const tubeTop = y + 14;
  const tubeH = h - 26;
  const liqTop = tubeTop + Math.round(tubeH * 0.46);
  const liqH = tubeTop + tubeH - liqTop - 2;
  const liq = getLiquidStyle(liquid);

  R.drawShadow(ctx, cx, y + h - 3, w * 0.46);

  ctx.fillStyle = makeLiquidGradient(x + 14, liqTop, liqH, liq);
  ctx.fillRect(x + 14, liqTop, w - 28, liqH);
  R.drawMeniscus(ctx, x + 14, liqTop, w - 28);

  drawGraduations(x + 14, tubeTop + 8, tubeH - 14, 10);
  R.drawGlassSheen(ctx, x + 13, tubeTop, w - 26, tubeH, 3);

  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 2.1;
  ctx.strokeRect(x + 13, tubeTop, w - 26, tubeH);

  R.drawMetalBar(ctx, x + 5, tubeTop + tubeH, w - 10, 10, "dark", 4);

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "600 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Éprouvette", cx, y + h + 14);
  ctx.textAlign = "start";
}

function drawFlask(item) {
  const { x, y, w, h, liquid } = item;
  const cx = x + w / 2;
  const bulbY = y + h - 42;
  const liq = getLiquidStyle(liquid);

  R.drawShadow(ctx, cx, y + h - 3, w * 0.42);

  ctx.beginPath();
  ctx.arc(cx, bulbY, 35, 0, Math.PI * 2);
  ctx.fillStyle = makeLiquidGradient(cx - 35, bulbY - 10, 45, liq);
  ctx.fill();
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 2.2;
  ctx.stroke();

  R.drawGlassSheen(ctx, cx - 35, bulbY - 35, 70, 70, 28);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(cx - 10, y + 10, 20, bulbY - 33 - (y + 10));
  ctx.strokeRect(cx - 10, y + 10, 20, bulbY - 33 - (y + 10));

  // خط العيار الدقيق
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 10, y + 48);
  ctx.lineTo(cx + 10, y + 48);
  ctx.stroke();

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "600 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Fiole jaugée", cx, y + h + 14);
  ctx.textAlign = "start";
}

function drawTestTube(item) {
  const { x, y, w, h, liquid } = item;
  const cx = x + w / 2;
  const liq = getLiquidStyle(liquid);

  R.drawShadow(ctx, cx, y + h - 3, w * 0.36);

  ctx.fillStyle = makeLiquidGradient(cx - 10, y + Math.round(h * 0.48), Math.round(h * 0.42), liq);
  ctx.beginPath();
  ctx.roundRect(cx - 10, y + Math.round(h * 0.48), 20, Math.round(h * 0.42), [0, 0, 12, 12]);
  ctx.fill();
  R.drawMeniscus(ctx, cx - 10, y + Math.round(h * 0.48), 20);

  R.drawGlassSheen(ctx, cx - 12, y + 12, 24, h - 22, 11);
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(cx - 12, y + 12, 24, h - 22, [2, 2, 14, 14]);
  ctx.stroke();

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "600 10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Tube à essai", cx, y + h + 14);
  ctx.textAlign = "start";
}

function drawRoundFlask(item) {
  const { x, y, w, h, liquid } = item;
  const cx = x + w / 2;
  const centerY = y + h - 42;
  const liq = getLiquidStyle(liquid);

  R.drawShadow(ctx, cx, y + h - 3, w * 0.44);

  ctx.beginPath();
  ctx.arc(cx, centerY, 39, 0, Math.PI * 2);
  ctx.fillStyle = makeLiquidGradient(cx - 39, centerY - 12, 50, liq);
  ctx.fill();
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 2.3;
  ctx.stroke();

  R.drawGlassSheen(ctx, cx - 39, centerY - 39, 78, 78, 32);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(cx - 12, y + 10, 24, centerY - 37 - (y + 10));
  ctx.strokeRect(cx - 12, y + 10, 24, centerY - 37 - (y + 10));

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "600 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Ballon", cx, y + h + 14);
  ctx.textAlign = "start";
}

function drawBurner(item) {
  const { x, y, w, h } = item;
  const cx = x + w / 2;
  const baseY = y + h - 18;

  R.drawShadow(ctx, cx, y + h - 3, w * 0.48);

  if (isLit) {
    const sway = Math.sin(timeTick * 0.16) * 3;
    const tipY = y - 38;

    const halo = ctx.createRadialGradient(cx, y + 10, 4, cx, y + 10, 56);
    halo.addColorStop(0, "rgba(56, 189, 248, 0.35)");
    halo.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, y + 10, 56, 0, Math.PI * 2);
    ctx.fill();

    // اللهب الخارجي
    ctx.beginPath();
    ctx.moveTo(cx - 12, y + 36);
    ctx.bezierCurveTo(cx - 21, y + 6, cx - 6, tipY + 14, cx + sway, tipY);
    ctx.bezierCurveTo(cx + 6, tipY + 14, cx + 21, y + 6, cx + 12, y + 36);
    ctx.closePath();

    const grad = ctx.createLinearGradient(cx, y + 36, cx, tipY);
    grad.addColorStop(0, "#1d4ed8");
    grad.addColorStop(0.55, "#0284c7");
    grad.addColorStop(1, "#bae6fd");
    ctx.fillStyle = grad;
    ctx.fill();

    // المخروط الداخلي الأزرق الساطع
    ctx.beginPath();
    ctx.moveTo(cx - 6, y + 36);
    ctx.lineTo(cx + sway * 0.4, y + 12);
    ctx.lineTo(cx + 6, y + 36);
    ctx.closePath();
    ctx.fillStyle = "#e0f2fe";
    ctx.fill();
  }

  // مدخل الغاز الجانبي
  R.drawMetalBar(ctx, x + w - 24, baseY - 12, 18, 7, "brass", 2);
  // أنبوب الموقد المعدني
  R.drawMetalBar(ctx, cx - 11, y + 36, 22, 68, "steel", 2);
  // حلقة تنظيم الهواء
  R.drawMetalBar(ctx, cx - 13, y + 68, 26, 13, "brass", 3);
  // قاعدة الموقد الثقيلة
  R.drawMetalBar(ctx, x + 7, baseY - 4, w - 14, 18, "dark", 6);

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "600 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Bec Bunsen", cx, y + h + 14);
  ctx.textAlign = "start";
}

function drawHotplate(item) {
  const { x, y, w, h } = item;
  const cx = x + w / 2;
  R.drawShadow(ctx, cx, y + h - 3, w * 0.49);

  R.drawCasing(ctx, x + 6, y + 24, w - 12, h - 28, "#1e293b", "#334155", 10);

  // سطح التسخين الخزفي
  const plateGrad = ctx.createLinearGradient(x + 14, y + 10, x + w - 14, y + 24);
  if (isLit) {
    plateGrad.addColorStop(0, "#991b1b");
    plateGrad.addColorStop(0.5, "#ef4444");
    plateGrad.addColorStop(1, "#7f1d1d");
  } else {
    plateGrad.addColorStop(0, "#334155");
    plateGrad.addColorStop(0.5, "#64748b");
    plateGrad.addColorStop(1, "#1e293b");
  }
  ctx.fillStyle = plateGrad;
  ctx.beginPath();
  ctx.roundRect(x + 14, y + 10, w - 28, 14, 4);
  ctx.fill();

  R.drawLcd(ctx, cx - 30, y + 42, 60, 22, `${Math.round(tempC)}°C`, "#064e3b", "#6ee7b7", 11);

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "600 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Plaque chauffante", cx, y + h + 14);
  ctx.textAlign = "start";
}

function drawStand(item) {
  const { x, y, w, h } = item;
  R.drawShadow(ctx, x + w / 2, y + h - 3, w * 0.46);
  R.drawMetalBar(ctx, x + 10, y + h - 14, w - 20, 12, "dark", 4);
  R.drawMetalBar(ctx, x + 24, y + 8, 7, h - 20, "steel", 3);
  R.drawMetalBar(ctx, x + 28, y + 54, w - 42, 5, "steel", 2);

  // مشبك الإمساك
  ctx.strokeStyle = "#f1f5f9";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x + w - 30, y + 45, 18, 22, 3);
  ctx.stroke();

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "600 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Statif & pince", x + w / 2, y + h + 14);
  ctx.textAlign = "start";
}

function drawThermometer(item) {
  const { x, y, w, h } = item;
  const cx = x + w / 2;
  R.drawShadow(ctx, cx, y + h - 3, w * 0.42);

  R.drawCasing(ctx, x + 6, y + 6, w - 12, 60, "#1e293b", "#334155", 9);
  R.drawLcd(ctx, x + 11, y + 14, w - 22, 30, `${Math.round(tempC)}°C`, "#064e3b", "#6ee7b7", 12);
  R.drawMetalBar(ctx, cx - 2.5, y + 66, 5, h - 82, "steel", 2);

  ctx.fillStyle = tempC > 50 ? "#ef4444" : "#38bdf8";
  ctx.beginPath();
  ctx.arc(cx, y + h - 14, 6.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "600 10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Thermomètre", cx, y + h + 14);
  ctx.textAlign = "start";
}

function drawPhMeter(item) {
  const { x, y, w, h, liquid } = item;
  const cx = x + w / 2;
  const liq = getLiquidStyle(liquid);
  R.drawShadow(ctx, cx, y + h - 3, w * 0.44);

  R.drawCasing(ctx, x + 6, y + 6, w - 12, 64, "#1e293b", "#334155", 9);
  R.drawLcd(ctx, x + 11, y + 14, w - 22, 32, `pH ${liq.ph}`, "#042f2e", "#5eead4", 12);
  R.drawMetalBar(ctx, cx - 3, y + 70, 6, h - 84, "steel", 2);

  ctx.fillStyle = "#0284c7";
  ctx.beginPath();
  ctx.roundRect(cx - 7, y + h - 22, 14, 12, 3);
  ctx.fill();

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "600 10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("pH-mètre", cx, y + h + 14);
  ctx.textAlign = "start";
}

function drawBalance(item) {
  const { x, y, w, h } = item;
  const cx = x + w / 2;
  R.drawShadow(ctx, cx, y + h - 3, w * 0.49);
  R.drawMetalBar(ctx, x + 16, y + 12, w - 32, 9, "steel", 3);
  R.drawCasing(ctx, x + 8, y + 24, w - 16, h - 28, "#1e293b", "#334155", 10);
  R.drawLcd(ctx, x + 20, y + 36, w - 40, 28, "125.0 g", "#064e3b", "#a7f3d0", 12);

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "600 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Balance", cx, y + h + 14);
  ctx.textAlign = "start";
}

function drawPipette(item) {
  const { x, y, w, h } = item;
  const cx = x + w / 2;
  R.drawShadow(ctx, cx, y + h - 3, w * 0.36);

  const bulbGrad = ctx.createRadialGradient(cx - 3, y + 18, 2, cx, y + 22, 15);
  bulbGrad.addColorStop(0, "#f87171");
  bulbGrad.addColorStop(1, "#991b1b");
  ctx.fillStyle = bulbGrad;
  ctx.beginPath();
  ctx.ellipse(cx, y + 22, 11, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  R.drawGlassSheen(ctx, cx - 4, y + 38, 8, h - 52, 2);
  ctx.strokeStyle = "#cbd5e1";
  ctx.strokeRect(cx - 4, y + 38, 8, h - 52);

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "600 10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Pipette", cx, y + h + 14);
  ctx.textAlign = "start";
}

function drawStirrer(item) {
  const { x, y, w, h } = item;
  const cx = x + w / 2;
  R.drawShadow(ctx, cx, y + h - 3, w * 0.49);

  R.drawCasing(ctx, x + 6, y + 16, w - 12, h - 20, "#1e293b", "#334155", 10);
  ctx.fillStyle = "#0284c7";
  ctx.beginPath();
  ctx.arc(x + w - 24, y + h - 20, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "600 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Agitateur", cx, y + h + 14);
  ctx.textAlign = "start";
}

function drawChemItem(item) {
  ctx.save();
  const cx = item.x + item.w / 2;
  const cy = item.y + item.h / 2;
  ctx.translate(cx, cy);
  ctx.rotate(((item.angle || 0) * Math.PI) / 180);
  ctx.translate(-cx, -cy);

  switch (item.type) {
    case "beaker": drawBeaker(item); break;
    case "erlenmeyer": drawErlenmeyer(item); break;
    case "cylinder": drawCylinder(item); break;
    case "flask": drawFlask(item); break;
    case "testtube": drawTestTube(item); break;
    case "roundflask": drawRoundFlask(item); break;
    case "burner": drawBurner(item); break;
    case "hotplate": drawHotplate(item); break;
    case "stand": drawStand(item); break;
    case "thermometer": drawThermometer(item); break;
    case "phmeter": drawPhMeter(item); break;
    case "balance": drawBalance(item); break;
    case "pipette": drawPipette(item); break;
    case "stirrer": drawStirrer(item); break;
  }

  R.drawSelectionBox(ctx, { ...item, selected: item.id === selectedId });
  ctx.restore();
}

function drawScene() {
  timeTick += 1;
  const targetTemp = isLit ? 185 : 22;
  tempC += (targetTemp - tempC) * 0.025;

  if (isLit && limeWaterActive && turbidity < 1) {
    turbidity = Math.min(1, turbidity + 0.008);
  }

  R.drawBench(ctx, chemCanvas.width, chemCanvas.height, 0.77);
  chemItems.forEach((item) => drawChemItem(item));

  chemStatus.style.color = "#94a3b8";
  chemStatus.textContent = `Instruments sur la paillasse : ${chemItems.length} • Touche Suppr pour effacer l'élément sélectionné`;

  requestAnimationFrame(drawScene);
}

function deleteSelectedItem() {
  if (!selectedId) return;
  chemItems = chemItems.filter((i) => i.id !== selectedId);
  selectedId = null;
  inspectorOpen = false;
  renderInspector();
}

window.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
  if (e.key === "Delete" || e.key === "Backspace") {
    e.preventDefault();
    deleteSelectedItem();
  }
});

document.querySelectorAll("[data-chem-tool]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const type = btn.getAttribute("data-chem-tool");
    const spec = TOOL_SPECS[type] || { w: 100, h: 140, name: type };
    const newItem = {
      id: Date.now() + Math.floor(Math.random() * 100),
      type,
      x: 240 + Math.random() * 760,
      y: 220 + Math.random() * 140,
      w: spec.w,
      h: spec.h,
      angle: 0,
      liquid: "water"
    };
    chemItems.push(newItem);
    selectedId = newItem.id;
    inspectorOpen = true;
    renderInspector();
  });
});

chemCanvas.addEventListener("mousedown", (e) => {
  const rect = chemCanvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (chemCanvas.width / rect.width);
  const my = (e.clientY - rect.top) * (chemCanvas.height / rect.height);

  let hit = null;
  for (let i = chemItems.length - 1; i >= 0; i--) {
    const item = chemItems[i];
    if (mx >= item.x && mx <= item.x + item.w && my >= item.y && my <= item.y + item.h) {
      hit = item;
      break;
    }
  }

  if (hit) {
    selectedId = hit.id;
    inspectorOpen = true;
    draggingItem = hit;
    dragOffsetX = mx - hit.x;
    dragOffsetY = my - hit.y;
    renderInspector();
  } else {
    selectedId = null;
    inspectorOpen = false;
    renderInspector();
  }
});

chemCanvas.addEventListener("mousemove", (e) => {
  if (!draggingItem) return;
  const rect = chemCanvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (chemCanvas.width / rect.width);
  const my = (e.clientY - rect.top) * (chemCanvas.height / rect.height);

  const maxBottom = Math.round(chemCanvas.height * 0.77) + 12;
  draggingItem.x = Math.max(10, Math.min(chemCanvas.width - draggingItem.w - 10, mx - dragOffsetX));
  draggingItem.y = Math.max(40, Math.min(maxBottom - draggingItem.h, my - dragOffsetY));
});

window.addEventListener("mouseup", () => {
  draggingItem = null;
});

inspectorCloseEl.addEventListener("click", () => {
  inspectorOpen = false;
  renderInspector();
});

rotateBtn.addEventListener("click", () => {
  const target = chemItems.find((i) => i.id === selectedId);
  if (!target) return;
  target.angle = ((target.angle || 0) + 15) % 360;
  renderInspector();
});

duplicateBtn.addEventListener("click", () => {
  const target = chemItems.find((i) => i.id === selectedId);
  if (!target) return;
  const copy = {
    ...target,
    id: Date.now() + Math.floor(Math.random() * 100),
    x: Math.min(chemCanvas.width - target.w - 16, target.x + 28),
    y: Math.max(45, target.y - 16)
  };
  chemItems.push(copy);
  selectedId = copy.id;
  inspectorOpen = true;
  renderInspector();
});

deleteSelectedBtn.addEventListener("click", deleteSelectedItem);

resetChemBtn.addEventListener("click", () => {
  isLit = false;
  limeWaterActive = false;
  turbidity = 0;
  tempC = 22;
  chemItems = createDefaultChemItems();
  selectedId = null;
  inspectorOpen = false;
  renderInspector();
});

if (toggleDrawerBtn && rightMatPanel) {
  toggleDrawerBtn.addEventListener("click", () => {
    const isHidden = rightMatPanel.classList.toggle("collapsed");
    toggleDrawerBtn.textContent = isHidden ? "🧰 Afficher matériel" : "🧰 Masquer matériel";
  });
}

drawScene();