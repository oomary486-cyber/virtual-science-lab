const rotatePhysBtn = document.getElementById("rotatePhysBtn");
const duplicatePhysBtn = document.getElementById("duplicatePhysBtn");
const deletePhysBtn = document.getElementById("deletePhysBtn");
const resetPhysBtn = document.getElementById("resetPhysBtn");
const toggleDrawerBtn = document.getElementById("toggleDrawerBtn");
const rightMatPanel = document.getElementById("rightMatPanel");
const physCanvas = document.getElementById("physCanvas");
const ctx = physCanvas.getContext("2d");
const physStatus = document.getElementById("physStatus");

const physInspectorEl = document.getElementById("physInspector");
const physInspectorTitleEl = document.getElementById("physInspectorTitle");
const physInspectorInfoEl = document.getElementById("physInspectorInfo");
const physInspectorControlsEl = document.getElementById("physInspectorControls");
const physInspectorCloseEl = document.getElementById("physInspectorClose");

const R = window.LabRender;

let voltageVal = 6.0;
let resistanceVal = 20;
let massGVal = 250;
let switchClosed = true;
let selectedId = null;
let inspectorOpen = false;
let draggingItem = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let rotorAngle = 0;

const PHYS_SPECS = {
  generator:   { w: 152, h: 116, name: "Générateur DC" },
  battery:     { w: 120, h: 108, name: "Pile plate 4.5 V" },
  resistor:    { w: 146, h: 88,  name: "Résistor" },
  rheostat:    { w: 160, h: 98,  name: "Rhéostat" },
  lamp:        { w: 130, h: 114, name: "Lampe" },
  motor:       { w: 130, h: 118, name: "Moteur DC" },
  switch:      { w: 128, h: 78,  name: "Interrupteur" },
  ammeter:     { w: 138, h: 114, name: "Ampèremètre" },
  voltmeter:   { w: 138, h: 114, name: "Voltmètre" },
  multimeter:  { w: 130, h: 154, name: "Multimètre" },
  balance:     { w: 140, h: 112, name: "Balance de précision" },
  cylinder:    { w: 80,  h: 176, name: "Éprouvette graduée" },
  cube:        { w: 80,  h: 80,  name: "Solide étalon" },
  dynamometer: { w: 70,  h: 174, name: "Dynamomètre" },
  pulley:      { w: 110, h: 138, name: "Poulie" }
};

function createDefaultPhysItems() {
  return [
    { id: 1, type: "generator", x: 180, y: 230, w: 152, h: 116, angle: 0 },
    { id: 2, type: "switch", x: 520, y: 115, w: 128, h: 78, angle: 0 },
    { id: 3, type: "resistor", x: 510, y: 345, w: 146, h: 88, angle: 0 },
    { id: 4, type: "ammeter", x: 860, y: 230, w: 138, h: 114, angle: 0 }
  ];
}

let physItems = createDefaultPhysItems();

function getPhysicsValues() {
  const hasGen = physItems.some((i) => i.type === "generator" || i.type === "battery");
  const hasRes = physItems.some((i) =>
    ["resistor", "rheostat", "lamp", "motor"].includes(i.type)
  );
  const active = switchClosed && hasGen && hasRes;
  const U = active ? voltageVal : 0;
  const I = active && resistanceVal > 0 ? U / resistanceVal : 0;
  const weightN = (massGVal / 1000) * 9.81;
  return { U_set: voltageVal, U, R: resistanceVal, I, massG: massGVal, weightN, active };
}

function renderPhysInspector() {
  const item = physItems.find((i) => i.id === selectedId);
  if (!item || !inspectorOpen) {
    physInspectorEl.classList.remove("active");
    return;
  }

  const p = getPhysicsValues();
  const spec = PHYS_SPECS[item.type] || { name: item.type };
  physInspectorEl.classList.add("active");
  physInspectorTitleEl.textContent = spec.name;

  let info = `Angle : ${item.angle || 0}°`;
  if (item.type === "generator" || item.type === "battery" || item.type === "voltmeter") {
    info += `<br>Tension : ${item.type === "battery" ? "4.5 V" : p.U.toFixed(1) + " V"}`;
  }
  if (item.type === "ammeter" || item.type === "multimeter" || item.type === "lamp" || item.type === "motor") {
    info += `<br>Intensité : ${p.I.toFixed(2)} A`;
  }
  if (item.type === "resistor" || item.type === "rheostat") {
    info += `<br>Résistance : ${p.R} Ω`;
  }
  if (item.type === "balance" || item.type === "cube") {
    info += `<br>Masse : ${p.massG} g`;
  }
  if (item.type === "dynamometer") {
    info += `<br>Poids : ${p.weightN.toFixed(2)} N`;
  }
  physInspectorInfoEl.innerHTML = info;

  physInspectorControlsEl.innerHTML = "";

  if (item.type === "generator") {
    const lbl = document.createElement("label");
    lbl.textContent = `Tension (${voltageVal.toFixed(1)} V) :`;
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "12";
    slider.step = "0.5";
    slider.value = String(voltageVal);
    slider.addEventListener("input", () => {
      voltageVal = parseFloat(slider.value);
      renderPhysInspector();
    });
    physInspectorControlsEl.appendChild(lbl);
    physInspectorControlsEl.appendChild(slider);
  }

  if (item.type === "resistor" || item.type === "rheostat") {
    const lbl = document.createElement("label");
    lbl.textContent = "Résistance :";
    const sel = document.createElement("select");
    sel.innerHTML = `
      <option value="10">10 Ω</option>
      <option value="20">20 Ω</option>
      <option value="50">50 Ω</option>
    `;
    sel.value = String(resistanceVal);
    sel.addEventListener("change", () => {
      resistanceVal = parseFloat(sel.value);
      renderPhysInspector();
    });
    physInspectorControlsEl.appendChild(lbl);
    physInspectorControlsEl.appendChild(sel);
  }

  if (item.type === "switch") {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = switchClosed ? "Ouvrir le circuit" : "Fermer le circuit";
    btn.addEventListener("click", () => {
      switchClosed = !switchClosed;
      renderPhysInspector();
    });
    physInspectorControlsEl.appendChild(btn);
  }

  if (item.type === "balance" || item.type === "cube" || item.type === "dynamometer") {
    const lbl = document.createElement("label");
    lbl.textContent = "Masse :";
    const sel = document.createElement("select");
    sel.innerHTML = `
      <option value="100">100 g</option>
      <option value="250">250 g</option>
      <option value="500">500 g</option>
    `;
    sel.value = String(massGVal);
    sel.addEventListener("change", () => {
      massGVal = parseFloat(sel.value);
      renderPhysInspector();
    });
    physInspectorControlsEl.appendChild(lbl);
    physInspectorControlsEl.appendChild(sel);
  }
}

function drawTerminals(x, y, w, h) {
  // مربط موجب أحمر
  R.drawMetalBar(ctx, x + 14, y + h - 20, 14, 10, "brass", 2);
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.arc(x + 21, y + h - 15, 5, 0, Math.PI * 2);
  ctx.fill();

  // مربط سالب أسود
  R.drawMetalBar(ctx, x + w - 28, y + h - 20, 14, 10, "steel", 2);
  ctx.fillStyle = "#090d16";
  ctx.beginPath();
  ctx.arc(x + w - 21, y + h - 15, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawDevice(item, p) {
  const { x, y, w, h, type } = item;
  const cx = x + w / 2;

  R.drawShadow(ctx, cx, y + h - 3, w * 0.49);

  if (type === "generator" || type === "battery") {
    const isBat = type === "battery";
    R.drawCasing(ctx, x, y, w, h, isBat ? "#172554" : "#1e293b", isBat ? "#1d4ed8" : "#334155", 12);
    R.drawLcd(ctx, x + 16, y + 14, w - 32, 34, isBat ? "4.5 V" : `${p.U.toFixed(1)} V`, "#042f2e", "#5eead4", 15);

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "600 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(isBat ? "Pile 4.5 V" : "Générateur DC", cx, y + 70);
    ctx.textAlign = "start";
    drawTerminals(x, y, w, h);
  } else if (type === "ammeter" || type === "voltmeter" || type === "multimeter") {
    const isAmp = type === "ammeter";
    const isVolt = type === "voltmeter";
    const baseC = isAmp ? "#450a0a" : isVolt ? "#172554" : "#1e293b";
    const lightC = isAmp ? "#991b1b" : isVolt ? "#1e40af" : "#334155";

    R.drawCasing(ctx, x, y, w, h, baseC, lightC, 12);
    const disp = isAmp ? `${p.I.toFixed(2)} A` : isVolt ? `${p.U.toFixed(1)} V` : `${p.I.toFixed(2)} A`;
    R.drawLcd(ctx, x + 14, y + 14, w - 28, 34, disp, "#042f2e", "#5eead4", 14);

    if (!isAmp && !isVolt) {
      ctx.fillStyle = "#090d16";
      ctx.beginPath();
      ctx.arc(cx, y + 92, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, y + 92);
      ctx.lineTo(cx + 12, y + 80);
      ctx.stroke();
    }

    ctx.fillStyle = "#f1f5f9";
    ctx.font = "600 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(isAmp ? "Ampèremètre" : isVolt ? "Voltmètre" : "Multimètre", cx, y + h - 28);
    ctx.textAlign = "start";
    drawTerminals(x, y, w, h);
  } else if (type === "resistor" || type === "rheostat") {
    const isRheo = type === "rheostat";
    R.drawCasing(ctx, x, y, w, h, "#1e293b", "#334155", 10);

    // جسم المقاومة السيراميكي
    const bodyGrad = ctx.createLinearGradient(x + 22, y + 12, x + 22, y + 36);
    bodyGrad.addColorStop(0, "#fef3c7");
    bodyGrad.addColorStop(1, "#d97706");
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(x + 22, y + 12, w - 44, 24, 6);
    ctx.fill();

    if (isRheo) {
      R.drawMetalBar(ctx, cx - 6, y + 7, 12, 34, "steel", 2);
    } else {
      const bands = ["#dc2626", "#0284c7", "#16a34a"];
      bands.forEach((c, idx) => {
        ctx.fillStyle = c;
        ctx.fillRect(x + 34 + idx * 17, y + 12, 6, 24);
      });
    }

    ctx.fillStyle = "#fbbf24";
    ctx.font = "700 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(isRheo ? "Rhéostat" : `R = ${p.R} Ω`, cx, y + 54);
    ctx.textAlign = "start";
    drawTerminals(x, y, w, h);
  } else if (type === "switch") {
    R.drawCasing(ctx, x, y, w, h, "#1e293b", "#334155", 10);

    // نقطة ارتكاز القاطع
    ctx.fillStyle = "#cbd5e1";
    ctx.beginPath();
    ctx.arc(x + 24, y + 34, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w - 24, y + 34, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = switchClosed ? "#4ade80" : "#f87171";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 24, y + 34);
    ctx.lineTo(x + w - 24, switchClosed ? y + 34 : y + 14);
    ctx.stroke();

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "600 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(switchClosed ? "Fermé" : "Ouvert", cx, y + 60);
    ctx.textAlign = "start";
  } else if (type === "lamp") {
    R.drawCasing(ctx, x, y, w, h, "#1e293b", "#334155", 12);

    const glow = Math.min(1, p.I / 0.6);
    if (glow > 0) {
      const halo = ctx.createRadialGradient(cx, y + 36, 4, cx, y + 36, 46);
      halo.addColorStop(0, `rgba(250, 204, 21, ${0.45 + glow * 0.5})`);
      halo.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, y + 36, 46, 0, Math.PI * 2);
      ctx.fill();
    }

    const bulbGrad = ctx.createRadialGradient(cx - 5, y + 31, 2, cx, y + 36, 19);
    if (glow > 0) {
      bulbGrad.addColorStop(0, "#ffffff");
      bulbGrad.addColorStop(0.5, "#fde047");
      bulbGrad.addColorStop(1, "#eab308");
    } else {
      bulbGrad.addColorStop(0, "#64748b");
      bulbGrad.addColorStop(1, "#334155");
    }

    ctx.beginPath();
    ctx.arc(cx, y + 36, 19, 0, Math.PI * 2);
    ctx.fillStyle = bulbGrad;
    ctx.fill();
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "600 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Lampe", cx, y + 74);
    ctx.textAlign = "start";
    drawTerminals(x, y, w, h);
  } else if (type === "motor") {
    R.drawCasing(ctx, x, y, w, h, "#1e293b", "#334155", 12);

    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(cx, y + 36, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, y + 36);
    ctx.rotate(rotorAngle);
    R.drawMetalBar(ctx, -18, -3, 36, 6, "steel", 2);
    R.drawMetalBar(ctx, -3, -18, 6, 36, "steel", 2);
    ctx.restore();

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "600 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Moteur DC", cx, y + 76);
    ctx.textAlign = "start";
    drawTerminals(x, y, w, h);
  } else if (type === "balance") {
    R.drawMetalBar(ctx, x + 16, y + 12, w - 32, 9, "steel", 3);
    R.drawCasing(ctx, x + 8, y + 24, w - 16, h - 28, "#1e293b", "#334155", 10);
    R.drawLcd(ctx, x + 20, y + 36, w - 40, 28, `${p.massG.toFixed(0)} g`, "#064e3b", "#a7f3d0", 12);

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "600 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Balance", cx, y + h + 14);
    ctx.textAlign = "start";
  } else if (type === "cylinder") {
    const liqGrad = ctx.createLinearGradient(0, y + 66, 0, y + h - 22);
    liqGrad.addColorStop(0, "rgba(125, 211, 252, 0.28)");
    liqGrad.addColorStop(1, "rgba(56, 189, 248, 0.5)");
    ctx.fillStyle = liqGrad;
    ctx.fillRect(x + 14, y + 66, w - 28, h - 88);
    R.drawMeniscus(ctx, x + 14, y + 66, w - 28);
    R.drawGlassSheen(ctx, x + 13, y + 12, w - 26, h - 26, 3);
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2.1;
    ctx.strokeRect(x + 13, y + 12, w - 26, h - 26);
    R.drawMetalBar(ctx, x + 6, y + h - 14, w - 12, 10, "dark", 4);

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "600 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Éprouvette", cx, y + h + 14);
    ctx.textAlign = "start";
  } else if (type === "cube") {
    const g = ctx.createLinearGradient(x + 10, y + 10, x + w - 10, y + h - 10);
    g.addColorStop(0, "#60a5fa");
    g.addColorStop(0.5, "#2563eb");
    g.addColorStop(1, "#1e3a8a");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(x + 10, y + 10, w - 20, h - 20, 8);
    ctx.fill();
    ctx.strokeStyle = "#93c5fd";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${p.massG}g`, cx, y + h / 2 + 4);
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "600 11px sans-serif";
    ctx.fillText("Solide", cx, y + h + 14);
    ctx.textAlign = "start";
  } else if (type === "dynamometer") {
    R.drawMetalBar(ctx, x + 12, y + 10, w - 24, h - 24, "dark", 6);
    R.drawLcd(ctx, x + 15, y + 20, w - 30, 24, `${p.weightN.toFixed(1)}N`, "#1e293b", "#fef08a", 11);

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "600 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Dynamomètre", cx, y + h + 14);
    ctx.textAlign = "start";
  } else if (type === "pulley") {
    R.drawMetalBar(ctx, x + 15, y + 10, 5, h - 24, "steel", 2);
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + 20, y + 26);
    ctx.lineTo(cx, y + 26);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, y + 48, 22, 0, Math.PI * 2);
    ctx.fillStyle = "#334155";
    ctx.fill();
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "600 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Poulie", cx, y + h + 14);
    ctx.textAlign = "start";
  }
}

function drawScene() {
  const p = getPhysicsValues();
  if (p.active && p.I > 0) {
    rotorAngle += Math.min(0.28, p.I * 0.45);
  }

  R.drawBench(ctx, physCanvas.width, physCanvas.height, 0.77);

  const elecTypes = [
    "generator", "battery", "resistor", "rheostat",
    "lamp", "motor", "switch", "ammeter", "voltmeter", "multimeter"
  ];
  const wired = physItems.filter((i) => elecTypes.includes(i.type));
  if (wired.length > 1) {
    ctx.strokeStyle = p.active && p.U > 0 ? "#ef4444" : "#64748b";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    wired.forEach((item, idx) => {
      const cx = item.x + item.w / 2;
      const cy = item.y + item.h / 2;
      if (idx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.closePath();
    ctx.stroke();
  }

  physItems.forEach((item) => {
    ctx.save();
    const cx = item.x + item.w / 2;
    const cy = item.y + item.h / 2;
    ctx.translate(cx, cy);
    ctx.rotate(((item.angle || 0) * Math.PI) / 180);
    ctx.translate(-cx, -cy);

    drawDevice(item, p);
    R.drawSelectionBox(ctx, { ...item, selected: item.id === selectedId });
    ctx.restore();
  });

  physStatus.style.color = "#94a3b8";
  physStatus.textContent = `Instruments sur la paillasse : ${physItems.length} • Touche Suppr pour effacer l'élément sélectionné`;

  requestAnimationFrame(drawScene);
}

function deleteSelectedPhysItem() {
  if (!selectedId) return;
  physItems = physItems.filter((i) => i.id !== selectedId);
  selectedId = null;
  inspectorOpen = false;
  renderPhysInspector();
}

window.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
  if (e.key === "Delete" || e.key === "Backspace") {
    e.preventDefault();
    deleteSelectedPhysItem();
  }
});

document.querySelectorAll("[data-phys-tool]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const type = btn.getAttribute("data-phys-tool");
    const spec = PHYS_SPECS[type] || { w: 120, h: 100, name: type };
    const newItem = {
      id: Date.now() + Math.floor(Math.random() * 100),
      type,
      x: 240 + Math.random() * 760,
      y: 210 + Math.random() * 150,
      w: spec.w,
      h: spec.h,
      angle: 0
    };
    physItems.push(newItem);
    selectedId = newItem.id;
    inspectorOpen = true;
    renderPhysInspector();
  });
});

physCanvas.addEventListener("mousedown", (e) => {
  const rect = physCanvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (physCanvas.width / rect.width);
  const my = (e.clientY - rect.top) * (physCanvas.height / rect.height);

  let hit = null;
  for (let i = physItems.length - 1; i >= 0; i--) {
    const item = physItems[i];
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
    renderPhysInspector();
  } else {
    selectedId = null;
    inspectorOpen = false;
    renderPhysInspector();
  }
});

physCanvas.addEventListener("mousemove", (e) => {
  if (!draggingItem) return;
  const rect = physCanvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (physCanvas.width / rect.width);
  const my = (e.clientY - rect.top) * (physCanvas.height / rect.height);

  const maxBottom = Math.round(physCanvas.height * 0.77) + 12;
  draggingItem.x = Math.max(10, Math.min(physCanvas.width - draggingItem.w - 10, mx - dragOffsetX));
  draggingItem.y = Math.max(35, Math.min(maxBottom - draggingItem.h, my - dragOffsetY));
});

window.addEventListener("mouseup", () => {
  draggingItem = null;
});

physInspectorCloseEl.addEventListener("click", () => {
  inspectorOpen = false;
  renderPhysInspector();
});

rotatePhysBtn.addEventListener("click", () => {
  const target = physItems.find((i) => i.id === selectedId);
  if (!target) return;
  target.angle = ((target.angle || 0) + 15) % 360;
  renderPhysInspector();
});

duplicatePhysBtn.addEventListener("click", () => {
  const target = physItems.find((i) => i.id === selectedId);
  if (!target) return;
  const copy = {
    ...target,
    id: Date.now() + Math.floor(Math.random() * 100),
    x: Math.min(physCanvas.width - target.w - 16, target.x + 28),
    y: Math.max(40, target.y - 16)
  };
  physItems.push(copy);
  selectedId = copy.id;
  inspectorOpen = true;
  renderPhysInspector();
});

deletePhysBtn.addEventListener("click", deleteSelectedPhysItem);

resetPhysBtn.addEventListener("click", () => {
  voltageVal = 6.0;
  resistanceVal = 20;
  massGVal = 250;
  switchClosed = true;
  physItems = createDefaultPhysItems();
  selectedId = null;
  inspectorOpen = false;
  renderPhysInspector();
});

if (toggleDrawerBtn && rightMatPanel) {
  toggleDrawerBtn.addEventListener("click", () => {
    const isHidden = rightMatPanel.classList.toggle("collapsed");
    toggleDrawerBtn.textContent = isHidden ? "🧰 Afficher matériel" : "🧰 Masquer matériel";
  });
}

drawScene();