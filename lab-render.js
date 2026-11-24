window.LabRender = {
  drawBench(ctx, width, height, benchRatio = 0.77) {
    const benchY = Math.round(height * benchRatio);

    // جدار المختبر بتدرج عميق
    const wallGrad = ctx.createLinearGradient(0, 0, 0, benchY);
    wallGrad.addColorStop(0, "#05080f");
    wallGrad.addColorStop(0.55, "#0d1422");
    wallGrad.addColorStop(1, "#162033");
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, width, benchY);

    // شبكة هندسية دقيقة
    ctx.strokeStyle = "rgba(148, 163, 184, 0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, benchY);
      ctx.stroke();
    }
    for (let y = 0; y < benchY; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // إضاءة علوية خفيفة فوق الطاولة
    const topGlow = ctx.createLinearGradient(0, benchY - 70, 0, benchY);
    topGlow.addColorStop(0, "rgba(56, 189, 248, 0)");
    topGlow.addColorStop(1, "rgba(56, 189, 248, 0.08)");
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, benchY - 70, width, 70);

    // سطح طاولة المختبر (Paillasse)
    const tableGrad = ctx.createLinearGradient(0, benchY, 0, height);
    tableGrad.addColorStop(0, "#2c384e");
    tableGrad.addColorStop(0.14, "#192233");
    tableGrad.addColorStop(0.65, "#0e131e");
    tableGrad.addColorStop(1, "#06080d");
    ctx.fillStyle = tableGrad;
    ctx.fillRect(0, benchY, width, height - benchY);

    // حافة الطاولة الأمامية
    ctx.fillStyle = "#7dd3fc";
    ctx.fillRect(0, benchY, width, 1.5);
    ctx.fillStyle = "#475569";
    ctx.fillRect(0, benchY + 1.5, width, 2);
  },

  drawShadow(ctx, cx, bottomY, rx, ry = 8) {
    ctx.save();
    const grad = ctx.createRadialGradient(cx, bottomY, 2, cx, bottomY, rx);
    grad.addColorStop(0, "rgba(0, 0, 0, 0.75)");
    grad.addColorStop(0.6, "rgba(0, 0, 0, 0.35)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.scale(1, ry / rx);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, bottomY * (rx / ry), rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  drawMetalBar(ctx, x, y, w, h, palette = "steel", radius = 2) {
    const grad = ctx.createLinearGradient(x, 0, x + w, 0);
    if (palette === "brass") {
      grad.addColorStop(0, "#451a03");
      grad.addColorStop(0.25, "#b45309");
      grad.addColorStop(0.5, "#fde68a");
      grad.addColorStop(0.78, "#92400e");
      grad.addColorStop(1, "#451a03");
    } else if (palette === "copper") {
      grad.addColorStop(0, "#431407");
      grad.addColorStop(0.3, "#c2410c");
      grad.addColorStop(0.52, "#fdba74");
      grad.addColorStop(0.8, "#9a3412");
      grad.addColorStop(1, "#431407");
    } else if (palette === "dark") {
      grad.addColorStop(0, "#090d16");
      grad.addColorStop(0.3, "#1e293b");
      grad.addColorStop(0.55, "#475569");
      grad.addColorStop(0.85, "#0f172a");
      grad.addColorStop(1, "#05070c");
    } else {
      grad.addColorStop(0, "#1e293b");
      grad.addColorStop(0.25, "#64748b");
      grad.addColorStop(0.48, "#f8fafc");
      grad.addColorStop(0.75, "#475569");
      grad.addColorStop(1, "#0f172a");
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fill();
  },

  drawCasing(ctx, x, y, w, h, baseColor = "#1e293b", lightColor = "#334155", radius = 12) {
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, lightColor);
    grad.addColorStop(0.5, baseColor);
    grad.addColorStop(1, "#0b111e");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fill();

    // حافة علوية مضيئة خفيفة
    ctx.strokeStyle = "rgba(226, 232, 240, 0.24)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(x + 0.6, y + 0.6, w - 1.2, h - 1.2, radius);
    ctx.stroke();

    ctx.strokeStyle = "#090d16";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.stroke();
  },

  drawGlassSheen(ctx, x, y, w, h, radius = 8) {
    const sheen = ctx.createLinearGradient(x, y, x + w, y);
    sheen.addColorStop(0, "rgba(255, 255, 255, 0.36)");
    sheen.addColorStop(0.14, "rgba(255, 255, 255, 0.08)");
    sheen.addColorStop(0.5, "rgba(255, 255, 255, 0.02)");
    sheen.addColorStop(0.86, "rgba(255, 255, 255, 0.06)");
    sheen.addColorStop(1, "rgba(255, 255, 255, 0.25)");

    ctx.fillStyle = sheen;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fill();

    // انعكاس عمودي حاد يعطي إيحاء الزجاج المصقول
    ctx.strokeStyle = "rgba(255, 255, 255, 0.48)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.12, y + 6);
    ctx.lineTo(x + w * 0.12, y + h - 6);
    ctx.stroke();
  },

  drawMeniscus(ctx, x, y, w, color = "rgba(255, 255, 255, 0.55)") {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + w / 2, y + 3.5, x + w, y);
    ctx.stroke();
  },

  drawLcd(ctx, x, y, w, h, text, bg = "#042f2e", fg = "#5eead4", fontSize = 14) {
    // إطار غائر للشاشة
    ctx.fillStyle = "#05080f";
    ctx.beginPath();
    ctx.roundRect(x - 2.5, y - 2.5, w + 5, h + 5, 6);
    ctx.fill();

    const lcdGrad = ctx.createLinearGradient(x, y, x, y + h);
    lcdGrad.addColorStop(0, bg);
    lcdGrad.addColorStop(1, "#021317");

    ctx.fillStyle = lcdGrad;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 4);
    ctx.fill();

    // لمعة خفيفة على الشاشة
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w * 0.65, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = fg;
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + w / 2, y + h / 2 + 0.5);
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "start";
  },

  drawSelectionBox(ctx, item) {
    if (!item.selected) return;
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.8;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(item.x - 6, item.y - 6, item.w + 12, item.h + 12);
    ctx.setLineDash([]);
  }
};