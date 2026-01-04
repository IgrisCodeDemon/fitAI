class FitAI {
    constructor() {
        this.scanCount = 0;
        this.dailyLimit = 3;
        this.init();
    }

    init() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const analyzeBtn = document.getElementById('analyzeBtn');

        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.showPreview(e.target.files[0]);
                analyzeBtn.disabled = false;
            }
        });

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
            const files = e.dataTransfer.files;
            if (files[0] && files[0].type.startsWith('image/')) {
                fileInput.files = files;
                this.showPreview(files[0]);
                analyzeBtn.disabled = false;
            }
        });

        analyzeBtn.addEventListener('click', () => this.analyze());
    }

    showPreview(file) {
        const uploadArea = document.getElementById('uploadArea');
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.style.cssText = 'max-width:100%;max-height:300px;border-radius:10px;margin-top:10px;';
        uploadArea.innerHTML = `
            <div style="font-weight:600;margin-bottom:6px;">Selected Photo</div>
        `;
        uploadArea.appendChild(img);

        const resetBtn = document.createElement('button');
        resetBtn.textContent = 'Change Photo';
        resetBtn.className = 'btn';
        resetBtn.style.marginTop = '10px';
        resetBtn.onclick = () => this.resetUpload();
        uploadArea.appendChild(resetBtn);
    }

    resetUpload() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const analyzeBtn = document.getElementById('analyzeBtn');

        fileInput.value = '';
        uploadArea.innerHTML = `
            <div class="upload-icon">📸</div>
            <h3>Upload a photo (front view works best)</h3>
            <p>Stand straight, full body visible, good lighting</p>
            <input type="file" id="fileInput" accept="image/*">
        `;
        analyzeBtn.disabled = true;
        this.init(); // rebind events
    }

    async analyze() {
        if (this.scanCount >= this.dailyLimit) {
            alert(`Free tier limit reached (${this.dailyLimit} scans/day). Upgrade for unlimited access!`);
            return;
        }

        const loading = document.getElementById('loading');
        const results = document.getElementById('results');
        const analyzeBtn = document.getElementById('analyzeBtn');

        loading.style.display = 'block';
        analyzeBtn.disabled = true;
        results.style.display = 'none';

        // Simulate AI processing
        await new Promise(resolve => setTimeout(resolve, 2500));

        this.scanCount++;
        this.showResults();
    }

    showResults() {
        const loading = document.getElementById('loading');
        const results = document.getElementById('results');
        const measurementsGrid = document.getElementById('measurementsGrid');
        const outfitsGrid = document.getElementById('outfitsGrid');

        loading.style.display = 'none';
        results.style.display = 'block';

        const mockMeasurements = this.generateMockMeasurements();
        const mockBodyType = this.inferBodyType(mockMeasurements);
        const mockSize = this.estimateSize(mockMeasurements);

        measurementsGrid.innerHTML = '';
        const entries = [
            { label: 'Height', value: mockMeasurements.height + ' cm' },
            { label: 'Chest', value: mockMeasurements.chest + ' cm' },
            { label: 'Waist', value: mockMeasurements.waist + ' cm' },
            { label: 'Hips', value: mockMeasurements.hips + ' cm' },
            { label: 'Inseam', value: mockMeasurements.inseam + ' cm' },
            { label: 'Recommended Size', value: mockSize }
        ];

        entries.forEach(item => {
            const div = document.createElement('div');
            div.className = 'measurement-item';
            div.innerHTML = `
                <div class="measurement-label">${item.label}</div>
                <div class="measurement-value">${item.value}</div>
            `;
            measurementsGrid.appendChild(div);
        });

        const sizeNote = document.createElement('div');
        sizeNote.className = 'measurement-size-note';
        sizeNote.textContent = `Detected body type: ${mockBodyType}. Recommendations are approximate and for demo only.`;
        measurementsGrid.parentElement.appendChild(sizeNote);

        const outfits = this.generateMockOutfits(mockBodyType, mockSize);
        outfitsGrid.innerHTML = '';
        outfits.forEach(o => {
            const card = document.createElement('div');
            card.className = 'outfit-card';
            card.innerHTML = `
                <div class="outfit-tag-bar">
                    <span>${o.occasion}</span>
                    <span>${o.formality}</span>
                </div>
                <div class="outfit-image">${o.visual}</div>
                <div class="outfit-info">
                    <div class="outfit-title">${o.title}</div>
                    <div class="outfit-meta">${o.detail}</div>
                    <div class="outfit-good">👍 Best for you: ${o.good}</div>
                    <div class="outfit-bad">🚫 Avoid: ${o.avoid}</div>
                </div>
            `;
            outfitsGrid.appendChild(card);
        });
    }

    generateMockMeasurements() {
        // Simple mock ranges; could be made gender/region aware later
        const baseHeight = 165 + Math.floor(Math.random() * 20); // 165–185
        const chest = 86 + Math.floor(Math.random() * 18);       // 86–104
        const waist = 70 + Math.floor(Math.random() * 18);       // 70–88
        const hips = 90 + Math.floor(Math.random() * 16);        // 90–106
        const inseam = 74 + Math.floor(Math.random() * 10);      // 74–84

        return { height: baseHeight, chest, waist, hips, inseam };
    }

    inferBodyType(m) {
        const hipWaistDiff = m.hips - m.waist;
        const chestHipDiff = m.chest - m.hips;

        if (hipWaistDiff > 14) return 'Curvy / Pear';
        if (Math.abs(chestHipDiff) <= 4) return 'Balanced / Rectangle';
        if (chestHipDiff > 6) return 'Inverted Triangle';
        return 'Classic / Regular';
    }

    estimateSize(m) {
        // Very rough, fake size mapping for demo
        const avg = (m.chest + m.waist + m.hips) / 3;
        if (avg < 82) return 'XS';
        if (avg < 90) return 'S';
        if (avg < 98) return 'M';
        if (avg < 106) return 'L';
        return 'XL';
    }

    generateMockOutfits(bodyType, size) {
        const baseFit = size;
        const isCurvy = bodyType.includes('Curvy') || bodyType.includes('Pear');
        const isInverted = bodyType.includes('Inverted');

        return [
            {
                occasion: 'Work',
                formality: 'Formal',
                visual: 'Tailored blazer + trousers',
                title: `Office Ready (${baseFit})`,
                detail: 'Structured blazer, fitted trousers, clean shirt for a sharp everyday office look.',
                good: isCurvy
                    ? 'High-waist trousers and slightly nipped-in blazer to highlight the waist.'
                    : 'Straight-leg trousers and regular-fit blazer for clean lines.',
                avoid: isInverted
                    ? 'Very padded shoulders that exaggerate upper body width.'
                    : 'Overly baggy suits that hide your natural shape.'
            },
            {
                occasion: 'Evening',
                formality: 'Smart Casual',
                visual: 'Dark denim + lightweight shirt',
                title: `Dinner & Dates (${baseFit})`,
                detail: 'Dark jeans, relaxed shirt or blouse, and smart sneakers/loafers.',
                good: isCurvy
                    ? 'Soft fabrics that skim the body and v-necklines to elongate the torso.'
                    : 'Fitted top with straight or slim bottoms for a balanced silhouette.',
                avoid: isCurvy
                    ? 'Boxy tops that cut across the widest part of the hips.'
                    : 'Very low-rise bottoms that shorten the legs.'
            },
            {
                occasion: 'Weekend',
                formality: 'Casual',
                visual: 'Relaxed tee + joggers',
                title: `Weekend Comfort (${baseFit})`,
                detail: 'Soft T-shirt, joggers or relaxed jeans, and easy sneakers.',
                good: 'Medium-weight fabrics and mid-rise bottoms for all-day comfort and balance.',
                avoid: 'Overly tight tops with ultra-skinny bottoms that restrict movement.'
            },
            {
                occasion: 'Special Event',
                formality: 'Dressy',
                visual: 'Midi dress / tailored set',
                title: `Events & Functions (${baseFit})`,
                detail: 'Midi dress or tailored co-ord with clean lines and minimal clutter.',
                good: isCurvy
                    ? 'Wrap or A-line shapes that follow your curves without clinging.'
                    : 'Column silhouettes and subtle structure to look sleek and modern.',
                avoid: 'Very shiny clingy fabrics that highlight areas you may not want to emphasize.'
            }
        ];
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new FitAI();
});
