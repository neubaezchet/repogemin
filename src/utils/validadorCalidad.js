// ============================================
// VALIDADOR DE CALIDAD DE IMÁGENES Y PDFs (v2)
// Estándares profesionales para preparar documentos para IA
//
// Mejoras v2:
//  - FIX: paraOCR ahora también aplica a PDFs (antes se perdía y los PDFs
//    siempre se validaban con los estándares estrictos).
//  - Análisis a resolución normalizada (máx 1500px) -> hasta 10x más rápido
//    con fotos de celular grandes y métricas comparables entre archivos.
//  - Contraste por percentiles (p2/p98) -> un píxel suelto ya no infla el valor.
//  - Ruido con estimador de alta frecuencia (Immerkær) -> ya no castiga a los
//    documentos de alto contraste (texto negro/fondo blanco), que son
//    justamente los que produce el mejorador HD del backend.
//  - En PDFs no se valida el tamaño del archivo por página renderizada
//    (el PNG generado no refleja la compresión del original).
// ============================================

import * as pdfjsLib from 'pdfjs-dist/webpack';

// Configurar worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * ESTÁNDARES DE CALIDAD PARA IA
 * Basados en documentación profesional OCR
 * (nitidez/ruido medidos a resolución normalizada de 1500px)
 */
const ESTANDARES = {
  // Resolución
  RESOLUCION_MINIMA: 1000,      // px ancho (mínimo absoluto)
  RESOLUCION_OPTIMA: 1500,       // px ancho (ideal para IA)

  // Nitidez (Laplacian variance)
  NITIDEZ_MINIMA: 50,            // Mínimo para texto legible
  NITIDEZ_OPTIMA: 150,           // Sin borrosidad

  // Contraste (percentiles p2..p98)
  CONTRASTE_MINIMO: 0.45,        // ratio mínimo
  CONTRASTE_OPTIMO: 0.70,        // ideal para OCR

  // Ruido (estimador Immerkær, sigma/255)
  RUIDO_MAXIMO: 0.06,            // máximo tolerable (~15/255)
  RUIDO_OPTIMO: 0.02,            // limpio

  // Tamaño archivo
  TAMANO_MINIMO_KB: 80,          // evita sobre-compresión
  TAMANO_OPTIMO_KB: 200,
};

/**
 * ✅ Estándares FLEXIBLES para Mistral OCR
 * Acepta calidad media-baja siempre que sea legible.
 * (El backend además auto-mejora a HD lo que llegue borroso.)
 */
const ESTANDARES_MISTRAL = {
  RESOLUCION_MINIMA: 600,        // Más flexible
  NITIDEZ_MINIMA: 25,            // Baja para documentos borrosos
  CONTRASTE_MINIMO: 0.30,        // Muy flexible
  RUIDO_MAXIMO: 0.10,            // Tolera ruido
  TAMANO_MINIMO_KB: 40,          // Más flexible
};

// Ancho al que se normaliza el análisis (velocidad + métricas comparables)
const ANCHO_ANALISIS = 1500;

/**
 * Calcula las métricas sobre un canvas ya normalizado.
 * Devuelve { nitidez, contraste, ruido } — una sola pasada de grises.
 */
const calcularMetricas = (ctx, width, height) => {
  const data = ctx.getImageData(0, 0, width, height).data;

  // Grises en un solo arreglo (evita recalcular en cada métrica)
  const gray = new Float32Array(width * height);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] = (data[i] + data[i + 1] + data[i + 2]) / 3;
  }

  // ========== NITIDEZ (varianza del Laplaciano) ==========
  let nitidez = 0;
  for (let y = 1; y < height - 1; y++) {
    const row = y * width;
    for (let x = 1; x < width - 1; x++) {
      const idx = row + x;
      const lap = 8 * gray[idx]
        - gray[idx - width - 1] - gray[idx - width] - gray[idx - width + 1]
        - gray[idx - 1] - gray[idx + 1]
        - gray[idx + width - 1] - gray[idx + width] - gray[idx + width + 1];
      nitidez += lap * lap;
    }
  }
  nitidez = nitidez / (width * height);

  // ========== CONTRASTE (percentiles p2 / p98) ==========
  const hist = new Uint32Array(256);
  for (let p = 0; p < gray.length; p++) hist[Math.round(gray[p])]++;
  const total = gray.length;
  let acum = 0, p2 = 0, p98 = 255;
  for (let v = 0; v < 256; v++) {
    acum += hist[v];
    if (acum >= total * 0.02) { p2 = v; break; }
  }
  acum = 0;
  for (let v = 255; v >= 0; v--) {
    acum += hist[v];
    if (acum >= total * 0.02) { p98 = v; break; }
  }
  const contraste = Math.max(0, (p98 - p2)) / 255;

  // ========== RUIDO (Immerkær: residuo de alta frecuencia) ==========
  // sigma = sqrt(pi/2) / (6*(W-2)*(H-2)) * sum |I ⊛ [1 -2 1; -2 4 -2; 1 -2 1]|
  let suma = 0;
  for (let y = 1; y < height - 1; y++) {
    const row = y * width;
    for (let x = 1; x < width - 1; x++) {
      const idx = row + x;
      const m = 4 * gray[idx]
        - 2 * (gray[idx - 1] + gray[idx + 1] + gray[idx - width] + gray[idx + width])
        + gray[idx - width - 1] + gray[idx - width + 1]
        + gray[idx + width - 1] + gray[idx + width + 1];
      suma += Math.abs(m);
    }
  }
  const sigma = Math.sqrt(Math.PI / 2) * suma / (6 * (width - 2) * (height - 2));
  const ruido = sigma / 255;

  return { nitidez, contraste, ruido };
};

/**
 * Valida métricas contra los estándares y arma la lista de problemas.
 */
const evaluarMetricas = ({ nitidez, contraste, ruido }, anchoOriginal,
                         tamanoKB, paraOCR, validarTamano) => {
  const estandares = paraOCR ? ESTANDARES_MISTRAL : ESTANDARES;
  const problemas = [];
  let esValido = true;

  if (anchoOriginal < estandares.RESOLUCION_MINIMA) {
    problemas.push(`Resolución muy baja (${anchoOriginal}px). Mínimo: ${estandares.RESOLUCION_MINIMA}px`);
    esValido = false;
  }

  if (nitidez < estandares.NITIDEZ_MINIMA) {
    problemas.push(`Imagen borrosa (nitidez: ${Math.round(nitidez)}). Toma la foto sin movimiento`);
    esValido = false;
  }

  if (contraste < estandares.CONTRASTE_MINIMO) {
    problemas.push('Contraste muy bajo. Usa mejor iluminación');
    esValido = false;
  }

  if (ruido > estandares.RUIDO_MAXIMO) {
    problemas.push('Imagen con demasiado ruido o pixelado');
    esValido = false;
  }

  if (validarTamano && tamanoKB < estandares.TAMANO_MINIMO_KB) {
    problemas.push(`Archivo muy comprimido (${Math.round(tamanoKB)}KB)`);
    esValido = false;
  }

  return {
    esValido,
    nivel: esValido ? 'optimo' : 'rechazado',
    metricas: {
      resolucion: anchoOriginal,
      nitidez: Math.round(nitidez),
      contraste: Math.round(contraste * 100) / 100,
      ruido: Math.round(ruido * 1000) / 1000,
      tamanoKB: Math.round(tamanoKB),
    },
    problemas,
  };
};

/**
 * Dibuja una fuente (img o canvas) en un canvas de análisis normalizado
 * (máx ANCHO_ANALISIS de ancho) y calcula/evalúa las métricas.
 */
const analizarFuente = (fuente, anchoOriginal, altoOriginal,
                        tamanoKB, paraOCR, validarTamano) => {
  const escala = Math.min(1, ANCHO_ANALISIS / anchoOriginal);
  const w = Math.max(2, Math.round(anchoOriginal * escala));
  const h = Math.max(2, Math.round(altoOriginal * escala));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(fuente, 0, 0, w, h);

  const metricas = calcularMetricas(ctx, w, h);
  return evaluarMetricas(metricas, anchoOriginal, tamanoKB, paraOCR, validarTamano);
};

/**
 * Analiza calidad de imagen con métricas profesionales
 * @param {File} file - Archivo a analizar
 * @param {Boolean} paraOCR - Si es true, usa estándares más flexibles para Mistral
 */
const analizarImagen = async (file, paraOCR = false) => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const resultado = analizarFuente(
          img, img.width, img.height, file.size / 1024, paraOCR, true
        );
        URL.revokeObjectURL(url);
        resolve(resultado);
      } catch (error) {
        URL.revokeObjectURL(url);
        resolve({
          esValido: false,
          nivel: 'rechazado',
          metricas: null,
          problemas: ['Error analizando la imagen'],
        });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        esValido: false,
        nivel: 'rechazado',
        metricas: null,
        problemas: ['Error cargando la imagen'],
      });
    };

    img.src = url;
  });
};

/**
 * Analiza PDF página por página
 * @param {File} file - PDF a analizar
 * @param {Boolean} paraOCR - Si es true, usa estándares más flexibles para Mistral
 */
const analizarPDF = async (file, paraOCR = false) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const resultadosPaginas = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      // Analizar directamente el canvas renderizado (sin pasar por PNG).
      // No se valida tamaño de archivo: el render no refleja la compresión.
      const resultado = analizarFuente(
        canvas, canvas.width, canvas.height, 0, paraOCR, false
      );
      resultadosPaginas.push({
        pagina: pageNum,
        ...resultado,
      });
    }

    // Determinar resultado general
    const algunaRechazada = resultadosPaginas.some(p => !p.esValido);

    const problemasGenerales = [];
    resultadosPaginas.forEach(pagina => {
      if (pagina.problemas.length > 0) {
        problemasGenerales.push(`Página ${pagina.pagina}: ${pagina.problemas[0]}`);
      }
    });

    return {
      esValido: !algunaRechazada,
      nivel: algunaRechazada ? 'rechazado' : 'optimo',
      metricas: {
        totalPaginas: resultadosPaginas.length,
        paginasValidas: resultadosPaginas.filter(p => p.esValido).length,
      },
      problemas: problemasGenerales,
    };

  } catch (error) {
    console.error('Error analizando PDF:', error);
    return {
      esValido: false,
      nivel: 'rechazado',
      metricas: null,
      problemas: ['Error al analizar el PDF'],
    };
  }
};

/**
 * Función principal exportada
 * @param {File} file - Archivo a validar
 * @param {Boolean} paraOCR - Si true, usa estándares flexibles para Mistral
 */
export const validarCalidadArchivo = async (file, paraOCR = false) => {
  if (file.type === 'application/pdf') {
    return await analizarPDF(file, paraOCR);
  } else if (file.type.startsWith('image/')) {
    return await analizarImagen(file, paraOCR);
  } else {
    return {
      esValido: false,
      nivel: 'rechazado',
      metricas: null,
      problemas: ['Tipo de archivo no soportado'],
    };
  }
};
