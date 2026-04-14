document.addEventListener('DOMContentLoaded', () => {
    
    // 1. ЛОГІКА КАСТОМНОГО КУРСОРУ ТА РОЗГОРТАННЯ КАРТОК
    const hint = document.getElementById('global-hint');
    const expandableItems = document.querySelectorAll('.expandable');

    if (hint && expandableItems.length > 0) {
        expandableItems.forEach(item => {
            item.addEventListener('mousemove', (e) => {
                if (item.classList.contains('is-expanded')) {
                    hint.style.opacity = '0';
                } else {
                    hint.style.opacity = '1';
                    // Використовуємо clientX/Y для fixed позиціонування
                    hint.style.left = e.clientX + 'px';
                    hint.style.top = e.clientY + 'px';
                }
            });

            item.addEventListener('mouseleave', () => {
                hint.style.opacity = '0';
            });

            item.addEventListener('click', () => {
                item.classList.toggle('is-expanded');
                if (item.classList.contains('is-expanded')) {
                    hint.style.opacity = '0';
                }
            });
        });
    }

    // 2. СИМУЛЯЦІЯ ДЕТЕКЦІЇ (сторінка instruments.html)
    const scannerCanvas = document.getElementById('scannerCanvas');
    const readoutCanvas = document.getElementById('readoutCanvas');

    if (scannerCanvas && readoutCanvas) {
        initDetectionSim(scannerCanvas, readoutCanvas);
    }

    // 3. СИМУЛЯЦІЯ СПЕКТРА (сторінка simulation.html)
    const cmbCanvas = document.getElementById('cmbCanvas');
    if (cmbCanvas) {
        initSimulation(cmbCanvas);
    }
});

// ФУНКЦІЯ: Симуляція детекції зорі
function initDetectionSim(scanCanvas, readCanvas) {
    const sCtx = scanCanvas.getContext('2d');
    const rCtx = readCanvas.getContext('2d');
    
    const starPos = { x: 225, y: 150 };
    const starIntensity = 150;
    const beamRadius = 30;
    
    let signalHistory = new Array(100).fill(0);
    let mousePos = { x: 0, y: 0 };

    scanCanvas.addEventListener('mousemove', (e) => {
        const rect = scanCanvas.getBoundingClientRect();
        mousePos.x = e.clientX - rect.left;
        mousePos.y = e.clientY - rect.top;
    });

    function animate() {
        sCtx.fillStyle = '#05060d';
        sCtx.fillRect(0, 0, scanCanvas.width, scanCanvas.height);
        
        const gradient = sCtx.createRadialGradient(starPos.x, starPos.y, 0, starPos.x, starPos.y, 40);
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(0.2, '#6d4aff');
        gradient.addColorStop(1, 'transparent');
        sCtx.fillStyle = gradient;
        sCtx.fillRect(0, 0, scanCanvas.width, scanCanvas.height);

        sCtx.strokeStyle = '#6d4aff';
        sCtx.lineWidth = 1;
        sCtx.beginPath();
        sCtx.arc(mousePos.x, mousePos.y, beamRadius, 0, Math.PI * 2);
        sCtx.stroke();
        
        sCtx.beginPath();
        sCtx.moveTo(mousePos.x - 10, mousePos.y); sCtx.lineTo(mousePos.x + 10, mousePos.y);
        sCtx.moveTo(mousePos.x, mousePos.y - 10); sCtx.lineTo(mousePos.x, mousePos.y + 10);
        sCtx.stroke();

        const dist = Math.sqrt(Math.pow(mousePos.x - starPos.x, 2) + Math.pow(mousePos.y - starPos.y, 2));
        const currentSignal = starIntensity * Math.exp(-(dist * dist) / (2 * Math.pow(beamRadius/1.5, 2)));
        
        signalHistory.push(currentSignal);
        signalHistory.shift();

        rCtx.fillStyle = '#05060d';
        rCtx.fillRect(0, 0, readCanvas.width, readCanvas.height);
        
        rCtx.strokeStyle = '#1a1b3a';
        for(let i=0; i<readCanvas.width; i+=40) {
            rCtx.beginPath(); rCtx.moveTo(i,0); rCtx.lineTo(i, readCanvas.height); rCtx.stroke();
        }

        rCtx.strokeStyle = '#6d4aff';
        rCtx.lineWidth = 2;
        rCtx.beginPath();
        const step = readCanvas.width / (signalHistory.length - 1);
        for(let i=0; i<signalHistory.length; i++) {
            const x = i * step;
            const y = readCanvas.height - 40 - signalHistory[i];
            if(i === 0) rCtx.moveTo(x, y);
            else rCtx.lineTo(x, y);
        }
        rCtx.stroke();

        rCtx.fillStyle = '#fff';
        rCtx.font = '10px monospace';
        rCtx.fillText("SIGNAL AMPLITUDE (μV)", 10, 20);
        rCtx.fillText(`PEAK: ${Math.max(...signalHistory).toFixed(2)}`, 10, 40);

        requestAnimationFrame(animate);
    }
    animate();
}

// ФУНКЦІЯ: Симуляція спектра потужності
function initSimulation(canvas) {
    const ctx = canvas.getContext('2d');
    const baryonSlider = document.getElementById('baryon');
    const cdmSlider = document.getElementById('cdm');
    const valBaryon = document.getElementById('val-baryon');
    const valCdm = document.getElementById('val-cdm');

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = '#232542';
        ctx.lineWidth = 1;
        for(let i=0; i<canvas.width; i+=100) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
        }

        const baryon = baryonSlider ? parseFloat(baryonSlider.value) : 0.022;
        const cdm = cdmSlider ? parseFloat(cdmSlider.value) : 0.120;

        // Оновлення тексту значень, якщо елементи існують
        if (valBaryon) valBaryon.textContent = baryon.toFixed(3);
        if (valCdm) valCdm.textContent = cdm.toFixed(3);

        ctx.beginPath();
        ctx.strokeStyle = '#6d4aff';
        ctx.lineWidth = 3;

        for(let l=0; l<canvas.width; l++) {
            let peak1 = Math.exp(-Math.pow(l - 180, 2)/4000) * (220 * (0.022/baryon));
            let peak2 = Math.exp(-Math.pow(l - 450, 2)/3000) * (110 * (baryon/0.022));
            let peak3 = Math.exp(-Math.pow(l - 750, 2)/5000) * (130 * (cdm/0.12));
            
            let total = (peak1 + peak2 + peak3) * Math.exp(-l/700);
            let y = canvas.height - 50 - total;

            if(l === 0) ctx.moveTo(l, y);
            else ctx.lineTo(l, y);
        }
        ctx.stroke();
        requestAnimationFrame(draw);
    }
    draw();
}