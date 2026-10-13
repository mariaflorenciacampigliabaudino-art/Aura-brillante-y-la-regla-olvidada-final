// Configuramos la ruta del worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

const bookContainer = document.getElementById('flip-book');
const loading = document.getElementById('loading');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');

let pageFlip = null;

// Cargar automáticamente el cuento "cuento.pdf" al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
    loadPDFFromURL('cuento.pdf');
    initRatingWidget();
});

// Función para cargar el PDF desde una ruta/URL fija
async function loadPDFFromURL(pdfUrl) {
    loading.style.display = 'block';
    bookContainer.style.display = 'none';
    bookContainer.innerHTML = '';

    if (pageFlip) {
        pageFlip.destroy();
        pageFlip = null;
    }

    try {
        // Cargar el documento PDF directamente desde la ruta
        const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
        const totalPages = pdf.numPages;

        // Obtenemos el tamaño de la primera página
        const firstPage = await pdf.getPage(1);
        const viewportInfo = firstPage.getViewport({ scale: 1.5 });
        const pageWidth = viewportInfo.width;
        const pageHeight = viewportInfo.height;

        // Procesar e iterar por cada página del PDF
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.5 });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };

            await page.render(renderContext).promise;

            const pageDiv = document.createElement('div');
            pageDiv.className = 'page';
            pageDiv.appendChild(canvas);

            bookContainer.appendChild(pageDiv);
        }

        // Inicializar Flipbook
        bookContainer.style.display = 'block';

        pageFlip = new St.PageFlip(bookContainer, {
            width: pageWidth,
            height: pageHeight,
            size: "stretch",
            minWidth: 315,
            maxWidth: pageWidth,
            minHeight: 420,
            maxHeight: pageHeight,
            showCover: true,
            maxShadowOpacity: 0.5,
            usePortrait: true
        });

        const pages = document.querySelectorAll('.page');
        pageFlip.loadFromHTML(pages);

        // Sonido al cambiar de página
        pageFlip.on('flip', (e) => {
            playPageFlipSound();
        });

        // Eventos de botones de navegación (anterior / siguiente)
        if (btnPrev) {
            btnPrev.addEventListener('click', () => pageFlip.flipPrev());
        }
        if (btnNext) {
            btnNext.addEventListener('click', () => pageFlip.flipNext());
        }

        loading.style.display = 'none';

    } catch (error) {
        console.error('Error al cargar el cuento:', error);
        loading.innerText = 'Error al procesar el cuento. Asegúrate de tener "cuento.pdf" en la misma carpeta.';
    }
}

// Reproducir sonido sintético de paso de página de libro
function playPageFlipSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const bufferSize = audioCtx.sampleRate * 0.12; // Duración breve de 120ms
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);

        // Generar sonido estático tipo papel deslizándose
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
        }

        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000; // Frecuencia de roce de hoja de papel

        noise.connect(filter);
        filter.connect(audioCtx.destination);

        noise.start();
    } catch (e) {
        // En navegadores el audio requiere una primera interacción previa
    }
}

// Sistema interactivo de calificación con 5 corazones
function initRatingWidget() {
    const hearts = document.querySelectorAll('.heart-btn');

    hearts.forEach(heart => {
        heart.addEventListener('click', () => {
            const rating = parseInt(heart.getAttribute('data-value'));

            hearts.forEach(h => {
                const hValue = parseInt(h.getAttribute('data-value'));
                if (hValue <= rating) {
                    h.classList.add('active');
                } else {
                    h.classList.remove('active');
                }
            });
        });
    });
}
