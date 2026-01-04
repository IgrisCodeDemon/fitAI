class FitAI {
  constructor() {
    this.scanCount = 0;
    this.dailyLimit = 3;
    this.currentFilter = 'all';
    this.outfits = [];
    this.useSampleProfile = false; // sample kid flag
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
        this.useSampleProfile = false;
        fileInput.files = e.dataTransfer.files;
        this.showPreview(file);
        analyzeBtn.disabled = false;
      }
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.useSampleProfile = false;
        this.showPreview(file);
        analyzeBtn.disabled = false;
      }
    });

    analyzeBtn.addEventListener('click', () => this.analyze());

    sampleBtn.addEventListener('click', () => {
      this.useSampleProfile = true;
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
        <div style="font-size:0.8rem; margin-bottom:6px; color:#d0e5ff;">Selected photo (simulated adult)</div>
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
      <div style="font-size:0.8rem; margin-bottom:6px; color:#d0e5ff;">Sample kid model (constant results)</div>
      <div style="border-radius:12px;background:linear-gradient(135deg,#4988c4,#0f2854);height:220px;display:flex;align-items:center;justify-content:center;color:#f5fbff;font-size:0.9rem;">
        Sample kid silhouette
      </div>
      <button class="btn btn-ghost" type="button" id="changePhotoBtn">Upload your own</button>
    `;
    document.getElementById('changePhotoBtn').onclick = () => this.resetUpload();
  }

  resetUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const analyzeBtn = document.getElementById('analyzeBtn');

    this.useSampleProfile = false;
    fileInput.value = '';
    uploadArea.innerHTML = `
      <div class="upload-icon">📸</div>
      <h4>Drag & drop or click to upload</h4>
      <p class="upload-help">
        Full‑body visible, front view, neutral background recommended. For quick testing
        you can rely on the built‑in sample kid profile.
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
    const kidsSize = this.estimateKidsSize(m.height, m.ageGroup);
    const fitPref = m.fitPreference;

    const summary = document.getElementById('measurementSummary');
    const modeLabel = this.useSampleProfile ? 'Sample kid profile (locked)' : 'Simulated adult profile';
    summary.innerHTML = `
      <strong>${modeLabel}</strong><br />
      <strong>Body type:</strong> ${bodyType} · <strong>Top:</strong> ${sizeTop}, <strong>Bottom:</strong> ${sizeBottom}<br />
      <strong>Kids equivalent:</strong> ${kidsSize}
      <div class="measurement-note">
        Demo values only. Real deployment should calibrate against your kids and adult size charts.
      </div>
    `;

    const grid = document.getElementById('measurementsGrid');
    grid.innerHTML = '';
    const entries = [
      ['Age group', m.ageGroup],
      ['Height', `${m.height} cm`],
      ['Shoulders', `${m.shoulder} cm`],
      ['Chest', `${m.chest} cm`],
      ['Waist', `${m.waist} cm`],
      ['Hips', `${m.hips} cm`],
      ['Inseam', `${m.inseam} cm`],
      ['Top size', sizeTop],
      ['Bottom size', sizeBottom],
      ['Kids size', kidsSize],
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

    this.outfits = this.generateMockOutfits(bodyType, sizeTop, sizeBottom, fitPref, m.ageGroup);
    this.renderOutfits();
  }

  // Constant sample kid + probabilistic adult
  generateMockMeasurements() {
    if (this.useSampleProfile) {
      // locked to your sample kid model (~5 ft ≈ 152 cm)[web:22]
      return {
        height: 152,
        chest: 78,
        waist: 66,
        hips: 84,
        shoulder: 36,
        inseam: 68,
        fitPreference: 'Tailored',
        ageGroup: 'Kids'
      };
    }

    // Simulated adult profile
    const baseHeight = 166 + Math.round(this.gaussianRandom() * 6);
    const chest = 88 + Math.round(this.gaussianRandom() * 6);
    const waist = chest - (6 + Math.round(Math.random() * 6));
    const hips = waist + (6 + Math.round(Math.random() * 8));
    const shoulder = 40 + Math.round(this.gaussianRandom() * 3);
    const inseam = Math.round(baseHeight * 0.45 + (Math.random() * 4 - 2));
    const fitPreference = Math.random() > 0.5 ? 'Tailored' : 'Relaxed';

    return {
      height: baseHeight,
      chest,
      waist,
      hips,
      shoulder,
      inseam,
      fitPreference,
      ageGroup: 'Adult'
    };
  }

  gaussianRandom() {
    let u = 0,
      v = 0;
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
    if (metric < 84) return 'XS';
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

  // simple demo mapping for kids height bands[web:21][web:23][web:31]
  estimateKidsSize(heightCm, ageGroup) {
    if (ageGroup === 'Adult') {
      // If adult, still show a bridge label
      return heightCm < 160 ? 'Teen / Petite' : 'Adult range';
    }
    if (heightCm < 95) return 'Toddler';
    if (heightCm < 111) return 'Kids S (3–5 yrs)';
    if (heightCm < 131) return 'Kids M (6–8 yrs)';
    if (heightCm < 151) return 'Kids L (9–12 yrs)';
    return 'Teen / Adult bridge';
  }

  generateMockOutfits(bodyType, topSize, bottomSize, fitPref, ageGroup) {
    const isCurvy = bodyType.includes('Curvy') || bodyType.includes('Pear');
    const isInverted = bodyType.includes('Inverted');
    const isRelaxed = fitPref === 'Relaxed';
    const isKid = ageGroup === 'Kids';

    const labelWork = isKid ? 'School / Study' : 'Work';
    const labelWeekend = isKid ? 'Playtime' : 'Weekend';

    return [
      {
        id: 'work-formal',
        bucket: 'Work',
        occasion: labelWork,
        formality: isKid ? 'Uniform / Neat' : 'Formal',
        title: `${labelWork} outfit (${topSize} / ${bottomSize})`,
        meta: isKid
          ? 'Neat shirt or polo with straight‑fit trousers or leggings and closed shoes.'
          : 'Structured blazer, tapered trousers, and a clean shirt for office days.',
        good: isCurvy
          ? 'Pieces that follow your natural waist without clinging at the hips.'
          : 'Straight lines and mid‑weight fabrics for a clean vertical look.',
        avoid: isInverted
          ? 'Very strong shoulder padding with narrow bottoms.'
          : 'Oversized sets that remove all shape.'
      },
      {
        id: 'evening',
        bucket: 'Evening',
        occasion: 'Evening',
        formality: 'Smart casual',
        title: `Evening look (${fitPref} fit)`,
        meta: isKid
          ? 'Comfortable dress or shirt‑and‑skirt combo with soft fabrics and easy shoes.'
          : 'Dark denim, draped shirt or blouse, and refined sneakers or loafers.',
        good: isCurvy
          ? 'Wrap or A‑line pieces that follow curves softly.'
          : 'Column silhouettes that visually lengthen the body.',
        avoid: isKid
          ? 'Anything too tight or scratchy for long wear.'
          : 'Ultra‑stiff fabrics that feel restrictive when seated.'
      },
      {
        id: 'weekend',
        bucket: 'Weekend',
        occasion: labelWeekend,
        formality: 'Casual',
        title: `${labelWeekend} comfort`,
        meta: isKid
          ? 'Soft tee with shorts, joggers, or leggings and supportive sneakers.'
          : 'Tee or sweatshirt with joggers or straight‑fit denim for relaxed days.',
        good: 'Breathable fabrics and mid‑rise waists that stay comfortable for play or errands.',
        avoid: 'Very tight tops with ultra‑compression bottoms.'
      },
      {
        id: 'event',
        bucket: 'Event',
        occasion: 'Event',
        formality: 'Dressy',
        title: `Events & celebrations`,
        meta: isKid
          ? 'Knee‑length dress or smart co‑ord with soft lining so it is easy to move and sit.'
          : 'Midi dress or tailored co‑ord set in an elevated fabric with clean lines.',
        good: isCurvy
          ? 'Shapes that skim the body and balance top and bottom proportions.'
          : 'Softly structured columns with subtle waist shaping.',
        avoid: 'Very shiny clingy fabrics that highlight every contour under strong light.'
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
