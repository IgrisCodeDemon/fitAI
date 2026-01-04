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
        <div style="font-size:0.8rem; margin-bottom:6px; color:#5a675d;">Selected photo</div>
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
      <div style="font-size:0.8rem; margin-bottom:6px; color:#5a675d;">Sample model</div>
      <div style="border-radius:12px;background:linear-gradient(135deg,#bdd2b6,#798777);height:220px;display:flex;align-items:center;justify-content:center;color:#f8ede3;font-size:0.9rem;">
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
        Stand straight, full body visible, neutral background. For this demo you
        can use any portrait‑style image.
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

    loading.style.display = 'block';
    analyzeBtn.disabled = true;

    await new Promise((resolve) => setTimeout(resolve, 2200));

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
    const size = this.estimateSize(m);

    const summary = document.getElementById('measurementSummary');
    summary.innerHTML = `
      <strong>Fit profile:</strong> ${bodyType} · Recommended size: ${size}
      <div class="measurement-note">
        These values are for demonstration only and do not replace professional tailoring.
      </div>
    `;

    const grid = document.getElementById('measurementsGrid');
    grid.innerHTML = '';
    const entries = [
      ['Height', `${m.height} cm`],
      ['Chest', `${m.chest} cm`],
      ['Waist', `${m.waist} cm`],
      ['Hips', `${m.hips} cm`],
      ['Inseam', `${m.inseam} cm`],
      ['Top size', size],
      ['Bottom size', size],
      ['Fit preference', m.fit],
      ['Formality mix', m.formality]
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

    this.outfits = this.generateMockOutfits(bodyType, size);
    this.renderOutfits();
  }

  generateMockMeasurements() {
    const height = 165 + Math.floor(Math.random() * 18);
    const chest = 86 + Math.floor(Math.random() * 18);
    const waist = 70 + Math.floor(Math.random() * 16);
    const hips = 90 + Math.floor(Math.random() * 16);
    const inseam = 74 + Math.floor(Math.random() * 8);
    const fit = Math.random() > 0.5 ? 'Tailored' : 'Relaxed';
    const formality = Math.random() > 0.5 ? 'Smart casual' : 'Mixed';

    return { height, chest, waist, hips, inseam, fit, formality };
  }

  inferBodyType(m) {
    const hipWaist = m.hips - m.waist;
    const chestHip = m.chest - m.hips;

    if (hipWaist > 14) return 'Curvy / Pear';
    if (Math.abs(chestHip) <= 4) return 'Balanced / Rectangle';
    if (chestHip > 6) return 'Inverted Triangle';
    return 'Classic / Regular';
  }

  estimateSize(m) {
    const avg = (m.chest + m.waist + m.hips) / 3;
    if (avg < 82) return 'XS';
    if (avg < 90) return 'S';
    if (avg < 98) return 'M';
    if (avg < 106) return 'L';
    return 'XL';
  }

  generateMockOutfits(bodyType, size) {
    const isCurvy = bodyType.includes('Curvy') || bodyType.includes('Pear');
    const isInverted = bodyType.includes('Inverted');

    return [
      {
        id: 'work-formal',
        bucket: 'Work',
        occasion: 'Work',
        formality: 'Formal',
        title: `Sharp office tailoring (${size})`,
        meta: 'Structured blazer, tapered trousers, minimal shirt.',
        good: isCurvy
          ? 'High‑waist trousers with a softly nipped‑in blazer to highlight your waistline.'
          : 'Straight‑leg trousers and lightly structured shoulders for clean vertical lines.',
        avoid: isInverted
          ? 'Heavy shoulder padding that exaggerates upper width.'
          : 'Oversized suits that remove shape completely.'
      },
      {
        id: 'work-smart',
        bucket: 'Work',
        occasion: 'Work',
        formality: 'Smart casual',
        title: `Hybrid workday look (${size})`,
        meta: 'Knit polo or blouse with slim chinos or dark denim.',
        good: 'Mid‑weight fabrics and mid‑rise bottoms that transition from desk to dinner.',
        avoid: 'Ultra‑skinny bottoms in stiff fabric that limit movement.'
      },
      {
        id: 'evening',
        bucket: 'Evening',
        occasion: 'Evening',
        formality: 'Smart casual',
        title: `Dinner & drinks (${size})`,
        meta: 'Dark jeans, fluid shirt or draped top, refined footwear.',
        good: isCurvy
          ? 'Wrap or faux‑wrap tops that follow curves without clinging.'
          : 'Fitted top with straight or slim bottoms for a sleek column effect.',
        avoid: isCurvy
          ? 'Boxy cropped tops cutting across the widest part of the hips.'
          : 'Very low‑rise bottoms that visually shorten the legs.'
      },
      {
        id: 'weekend',
        bucket: 'Weekend',
        occasion: 'Weekend',
        formality: 'Casual',
        title: `Weekend off‑duty (${size})`,
        meta: 'Relaxed tee, soft joggers or straight‑fit denim, clean sneakers.',
        good: 'Breathable knits and mid‑rise waistbands for all‑day ease.',
        avoid: 'Overly tight tops with ultra‑fitted leggings in thick fabric.'
      },
      {
        id: 'event',
        bucket: 'Event',
        occasion: 'Event',
        formality: 'Dressy',
        title: `Events & celebrations (${size})`,
        meta: 'Midi dress or tailored co‑ord in elevated fabric.',
        good: isCurvy
          ? 'A‑line or wrap silhouettes that follow your shape and balance proportions.'
          : 'Softly structured column shapes with subtle waist definition.',
        avoid: 'Very shiny, clingy fabrics that highlight every contour under harsh lighting.'
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
      grid.innerHTML = '<p style="font-size:0.86rem;color:#5a675d;">Run a scan to see outfits tailored to your profile.</p>';
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
