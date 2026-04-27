// Lazy loaders لمكاتب الاستخراج عشان نحافظ على سرعة التطبيق
let _htmlToImageState = "idle";
export function loadHtmlToImage() {
  return new Promise((resolve, reject) => {
    if (_htmlToImageState === "ready") return resolve(window.htmlToImage);
    if (_htmlToImageState === "loading") {
      const iv = setInterval(() => {
        if (_htmlToImageState === "ready") {
          clearInterval(iv);
          resolve(window.htmlToImage);
        }
        if (_htmlToImageState === "idle") {
          clearInterval(iv);
          reject(new Error("فشل التحميل"));
        }
      }, 50);
      return;
    }
    _htmlToImageState = "loading";
    const s = document.createElement("script");
    s.src =
      "https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.min.js";
    s.onload = () => {
      _htmlToImageState = "ready";
      resolve(window.htmlToImage);
    };
    s.onerror = () => {
      _htmlToImageState = "idle";
      reject(new Error("فشل تحميل html-to-image"));
    };
    document.head.appendChild(s);
  });
}

let _jsPdfState = "idle";
export function loadJsPdf() {
  return new Promise((resolve, reject) => {
    if (_jsPdfState === "ready") return resolve(window.jspdf);
    if (_jsPdfState === "loading") {
      const iv = setInterval(() => {
        if (_jsPdfState === "ready") {
          clearInterval(iv);
          resolve(window.jspdf);
        }
        if (_jsPdfState === "idle") {
          clearInterval(iv);
          reject(new Error("فشل التحميل"));
        }
      }, 50);
      return;
    }
    _jsPdfState = "loading";
    const s = document.createElement("script");
    s.src =
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.onload = () => {
      _jsPdfState = "ready";
      resolve(window.jspdf);
    };
    s.onerror = () => {
      _jsPdfState = "idle";
      reject(new Error("فشل تحميل jsPDF"));
    };
    document.head.appendChild(s);
  });
}

let _gifState = "idle",
  _gifWorkerUrl = null;
export async function loadGifJs() {
  if (_gifState === "ready") return _gifWorkerUrl;
  if (_gifState === "loading") {
    await new Promise((resolve, reject) => {
      const iv = setInterval(() => {
        if (_gifState === "ready") {
          clearInterval(iv);
          resolve();
        }
        if (_gifState === "idle") {
          clearInterval(iv);
          reject(new Error("فشل التحميل"));
        }
      }, 50);
    });
    return _gifWorkerUrl;
  }
  _gifState = "loading";
  try {
    if (!window.GIF) {
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js";
        s.onload = resolve;
        s.onerror = () => reject(new Error("فشل تحميل gif.js"));
        document.head.appendChild(s);
      });
    }
    if (!_gifWorkerUrl) {
      const res = await fetch(
        "https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js"
      );
      if (!res.ok) throw new Error("فشل تحميل gif.worker.js");
      _gifWorkerUrl = URL.createObjectURL(
        new Blob([await res.text()], { type: "text/javascript" })
      );
    }
    _gifState = "ready";
    return _gifWorkerUrl;
  } catch (e) {
    _gifState = "idle";
    throw e;
  }
}

// دالة تجميد الأنيميشن أثناء التصوير
export function freezeAnimations(el) {
  const nodes = [el, ...el.querySelectorAll("*")];
  const saved = nodes.map((n) => ({
    animation: n.style.animation,
    transition: n.style.transition,
    animationPlayState: n.style.animationPlayState,
  }));
  nodes.forEach((n) => {
    n.style.animationPlayState = "paused";
    n.style.transition = "none";
  });
  return () =>
    nodes.forEach((n, i) => {
      n.style.animation = saved[i].animation;
      n.style.transition = saved[i].transition;
      n.style.animationPlayState = saved[i].animationPlayState;
    });
}

// دالة التصوير الذكية (بتجرب 3 مرات لتفادي مشاكل الخطوط)
export async function captureElement(el, pixelRatio = 2) {
  const htmlToImage = await loadHtmlToImage();
  await document.fonts.ready;
  await new Promise((r) =>
    requestAnimationFrame(() => requestAnimationFrame(r))
  );

  const opts = {
    backgroundColor: "#ffffff",
    pixelRatio,
    skipFonts: false,
    useCORS: true,
    allowTaint: false,
    cacheBust: true,
  };

  let dataUrl;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      dataUrl = await htmlToImage.toPng(el, opts);
      if (dataUrl && dataUrl.length > 1000) break;
    } catch (e) {
      if (attempt === 2) throw e;
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  return dataUrl;
}

export function dataUrlToCanvas(dataUrl, w, h) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      resolve(c);
    };
    img.src = dataUrl;
  });
}
