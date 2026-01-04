class FitAI {
  constructor() {
    this.scanCount = 0;
    this.dailyLimit = 3;
    this.currentFilter = 'all';
    this.outfits = [];
    this.bindBase();
  }

  bindBase() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const sampleBtn = document.getElementById('sampleBtn');

    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        fileInput.files = e.dataTransfer.files;
        this.showPreview(file);
        analyzeBtn.disabled = false;
      }
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.showPreview(file);
        analyzeBtn.disabled = false;
      }
    });

    analyzeBtn.addEventListener('click', () => this.analyze());

    sampleBtn.addEventListener('click', () => {
      this.showSamplePreview();
      analyzeBtn.disabled = false;
    });

    document.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        this.currentFilter = chip.dataset.filter;
        this.renderOutfits();
      });
    });

    this.updateScanCounter();
  }

  showPreview(file) {
    const uploadArea = document.getElementById('uploadArea');
    const reader = new FileReader();
    reader.onload = () => {
      uploadArea.innerHTML = `
        <div style="font-size:0.8rem; margin-bottom:6px; color:#d0e5ff;">Selected photo</div>
        <img src="${reader.result}" alt="Uploaded person" style="max-width:100%;max-height:260px;border-radius:12px;display:block;margin:0 auto 8px;" />
        <button class="btn btn-ghost" type="button" id="changePhotoBtn">Change photo</button>
      `;
      document.getElementById('changePhotoBtn').onclick = () => this.resetUpload();
    };
    reader.readAsDataURL(file);
  }

  showSamplePreview() {
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.innerHTML = `
      <div style="font-size:0.8rem; margin-bottom:6px; color:#d0e5ff;">Sample synthetic body</div>
      <div style="border-radius:12px;background:linear-gradient(135deg,#4988c4,#0f2854);height:220px;display:flex;align-items:center;justify-content:center;color:#f5fbff;font-size:0.9rem;">
        Sample silhouette illustration
      </div>
      <button class="btn btn-ghost" type="button" id="changePhotoBtn">Upload your own</button>
    `;
    document.getElementById('changePhotoBtn').onclick = () => this.resetUpload();
  }

  resetUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const analyzeBtn = document.getElementById('analyzeBtn');

    fileInput.value = '';
    uploadArea.innerHTML = `
      <div class="upload-icon">📸</div>
      <h4>Drag & drop or click to upload</h4>
      <p class="upload-help">
        Full‑body visible, front view, neutral background recommended. Any portrait
        image works for testing.
      </p>
      <input type="file" id="fileInput" accept="image/*" />
    `;
    analyzeBtn.disabled = true;

    this.bindBase();
  }

  async analyze() {
    if (this.scanCount >= this.dailyLimit) {
      alert(`Free tier limit reached (${this.dailyLimit} scans/day). Upgrade for unlimited access.`);
      return;
    }

    const loading = document.getElementById('loading');
    const analyzeBtn = document.getElementById('analyzeBtn');

    loading.style.display = 'flex';
    analyzeBtn.disabled = true;

    await new Promise((resolve) => setTimeout(resolve, 2300));

    this.scanCount++;
    this.updateScanCounter();
    this.generateResults();

    loading.style.display = 'none';
    analyzeBtn.disabled = false;
  }

  updateScanCounter() {
    const label = document.getElementById('scanCounter');
    label.textContent = `Free tier: ${this.scanCount} / ${this.dailyLimit} scans used today`;
  }

  generateResults() {
    const m = this.generateMockMeasurements();
    const bodyType = this.inferBodyType(m);
    const sizeTop = this.estimateTopSize(m);
    const sizeBottom = this.estimateBottomSize(m);
    const fitPref = m.fitPreference;

    const summary = document.getElementById('measurementSummary');
    summary.innerHTML = `
      <strong>Fit profile:</strong> ${bodyType} · Top: ${sizeTop}, Bottom: ${sizeBottom}
      <div class="measurement-note">
        Demo values only. Real deployment should calibrate against your brand charts and test sets.
      </div>
    `;

    const grid = document.getElementById('measurementsGrid');
    grid.innerHTML = '';
    const entries = [
      ['Height', `${m.height} cm`],
      ['Shoulders', `${m.shoulder} cm`],
      ['Chest', `${m.chest} cm`],
      ['Waist', `${m.waist} cm`],
      ['Hips', `${m.hips} cm`],
      ['Inseam', `${m.inseam} cm`],
      ['Top size', sizeTop],
      ['Bottom size', sizeBottom],
      ['Fit preference', fitPref]
    ];

    entries.forEach(([label, value]) => {
      const el = document.createElement('div');
      el.className = 'measurement-item';
      el.innerHTML = `
        <div class="measurement-label">${label}</div>
        <div class="measurement-value">${value}</div>
      `;
      grid.appendChild(el);
    });

    this.outfits = this.generateMockOutfits(bodyType, sizeTop, sizeBottom, fitPref);
    this.renderOutfits();
  }

  // More structured mock ranges
  generateMockMeasurements() {
    // Heights biased around 170–178
    const baseHeight = 166 + Math.round(this.gaussianRandom() * 6); // approx 158–184
    const chest = 88 + Math.round(this.gaussianRandom() * 6);      // 80–104
    const waist = chest - (6 + Math.round(Math.random() * 6));     // slightly smaller than chest
    const hips = waist + (6 + Math.round(Math.random() * 8));      // usually > waist
    const shoulder = 40 + Math.round(this.gaussianRandom() * 3);   // 36–48
    const inseam = Math.round(baseHeight * 0.45 + (Math.random() * 4 - 2));

    const fitPreference = Math.random() > 0.5 ? 'Tailored' : 'Relaxed';

    return { height: baseHeight, chest, waist, hips, shoulder, inseam, fitPreference };
  }

  // Gaussian helper (Box–Muller, clipped)
  gaussianRandom() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    const normalized = num / 2.5;
    return Math.max(-3, Math.min(3, normalized));
  }

  inferBodyType(m) {
    const hipWaist = m.hips - m.waist;
    const chestHip = m.chest - m.hips;

    if (hipWaist > 16) return 'Curvy / Pear';
    if (Math.abs(chestHip) <= 4) return 'Balanced / Rectangle';
    if (chestHip > 8) return 'Inverted Triangle';
    return 'Classic / Regular';
  }

  estimateTopSize(m) {
    const metric = (m.chest + m.shoulder) / 2;
    if (metric < 86) return 'XS';
    if (metric < 92) return 'S';
    if (metric < 100) return 'M';
    if (metric < 108) return 'L';
    return 'XL';
  }

  estimateBottomSize(m) {
    const metric = (m.waist + m.hips) / 2;
    if (metric < 84) return 'XS';
    if (metric < 92) return 'S';
    if (metric < 100) return 'M';
    if (metric < 108) return 'L';
    return 'XL';
  }

  generateMockOutfits(bodyType, topSize, bottomSize, fitPref) {
    const isCurvy = bodyType.includes('Curvy') || bodyType.includes('Pear');
    const isInverted = bodyType.includes('Inverted');
    const isRelaxed = fitPref === 'Relaxed';

    return [
      {
        id: 'work-formal',
        bucket: 'Work',
        occasion: 'Work',
        formality: 'Formal',
        title: `Structured office look (Top ${topSize}, Bottom ${bottomSize})`,
        meta: 'Lightweight blazer, tapered trousers, and a clean shirt for everyday office use.',
        good: isCurvy
          ? 'High‑rise trousers and a slightly cinched blazer to keep shoulders and hips balanced.'
          : 'Straight‑leg trousers and lightly structured shoulders for clean vertical lines.',
        avoid: isInverted
          ? 'Strong shoulder padding and narrow trousers that exaggerate upper width.'
          : 'Very oversized suits that hide your natural proportions.'
      },
      {
        id: 'work-smart',
        bucket: 'Work',
        occasion: 'Work',
        formality: 'Smart casual',
        title: `Hybrid workday outfit (${fitPref} fit)`,
        meta: 'Fine‑gauge knit or polo with slim chinos or dark denim and minimalist shoes.',
        good: isRelaxed
          ? 'Soft knits and slightly tapered trousers that move easily through the day.'
          : 'Sharper lines in the top with a bit of ease in the legs for comfort.',
        avoid: 'Ultra‑stiff fabrics that crease heavily when sitting at a desk.'
      },
      {
        id: 'evening',
        bucket: 'Evening',
        occasion: 'Evening',
        formality: 'Smart casual',
        title: `Dinner & drinks ensemble`,
        meta: 'Dark jeans, draped shirt or blouse, and refined sneakers or loafers.',
        good: isCurvy
          ? 'Wrap or faux‑wrap tops that follow curves without clinging.'
          : 'Column silhouettes with a slightly shorter top to lengthen the legs.',
        avoid: isCurvy
          ? 'Boxy cropped tops that end at the widest part of your hips.'
          : 'Very low‑rise bottoms that visually shorten your frame.'
      },
      {
        id: 'weekend',
        bucket: 'Weekend',
        occasion: 'Weekend',
        formality: 'Casual',
        title: `Off‑duty weekend set`,
        meta: 'Soft tee or sweatshirt with joggers or straight‑fit denim and easy sneakers.',
        good: 'Mid‑weight fabrics and mid‑rise waists that stay comfortable for long hours.',
        avoid: 'Overly tight tops paired with ultra‑compression leggings in thick fabric.'
      },
      {
        id: 'event',
        bucket: 'Event',
        occasion: 'Event',
        formality: 'Dressy',
        title: `Events & celebrations outfit`,
        meta: 'Midi dress or tailored co‑ord in an elevated fabric with clean lines.',
        good: isCurvy
          ? 'A‑line or wrap shapes that follow your curves and balance proportions.'
          : 'Softly structured column silhouettes with subtle waist definition.',
        avoid: 'High‑shine, clingy fabrics that highlight every contour under bright light.'
      }
    ];
  }

  renderOutfits() {
    const grid = document.getElementById('outfitsGrid');
    grid.innerHTML = '';

    const filtered =
      this.currentFilter === 'all'
        ? this.outfits
        : this.outfits.filter((o) =>
            this.currentFilter === 'Event' ? o.bucket === 'Event' : o.bucket === this.currentFilter
          );

    if (!filtered.length) {
      grid.innerHTML =
        '<p class="placeholder-text">Run a scan to see outfits tailored to your profile.</p>';
      return;
    }

    filtered.forEach((o) => {
      const card = document.createElement('article');
      card.className = 'outfit-card';
      card.innerHTML = `
        <div class="outfit-tag-row">
          <span>${o.occasion}</span>
          <span>${o.formality}</span>
        </div>
        <div class="outfit-title">${o.title}</div>
        <div class="outfit-meta">${o.meta}</div>
        <div class="outfit-good">👍 ${o.good}</div>
        <div class="outfit-bad">🚫 ${o.avoid}</div>
      `;
      grid.appendChild(card);
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new FitAI();
});

