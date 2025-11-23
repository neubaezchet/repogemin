// ============================================
// VALIDADOR DE CALIDAD DE IMÁGENES Y PDFs
// Estándares profesionales para preparar documentos para IA
// ============================================

import * as pdfjsLib from 'pdfjs-dist/webpack';

// Configurar worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * ESTÁNDARES DE CALIDAD PARA IA
 * Basados en documentación profesional OCR
 */
const ESTANDARES = {
  // Resolución
  RESOLUCION_MINIMA: 1000,      // px ancho (mínimo absoluto)
  RESOLUCION_OPTIMA: 1500,       // px ancho (ideal para IA)
  
  // Nitidez (Laplacian variance)
  NITIDEZ_MINIMA: 50,            // Mínimo para texto legible
  NITIDEZ_OPTIMA: 150,           // Sin borrosidad
  
  // Contraste
  CONTRASTE_MINIMO: 0.45,        // ratio mínimo
  CONTRASTE_OPTIMO: 0.70,        // ideal para OCR
  
  // Ruido
  RUIDO_MAXIMO: 0.50,            // máximo tolerable
  RUIDO_OPTIMO: 0.30,            // limpio
  
  // Tamaño archivo
  TAMANO_MINIMO_KB: 80,          // evita sobre-compresión
  TAMANO_OPTIMO_KB: 200,
};

/**
 * Analiza calidad de imagen con métricas profesionales
 */
const analizarImagen = async (file) => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // ========== NITIDEZ (Laplacian) ==========
        let nitidez = 0;
        const kernel = [-1, -1, -1, -1, 8, -1, -1, -1, -1];
        
        for (let y = 1; y < canvas.height - 1; y++) {
          for (let x = 1; x < canvas.width - 1; x++) {
            let sum = 0;
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const idx = ((y + ky) * canvas.width + (x + kx)) * 4;
                const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                sum += gray * kernel[(ky + 1) * 3 + (kx + 1)];
              }
            }
            nitidez += sum * sum;
          }
        }
        nitidez = nitidez / (canvas.width * canvas.height);

        // ========== CONTRASTE ==========
        let min = 255, max = 0;
        for (let i = 0; i < data.length; i += 4) {
          const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
          if (gray < min) min = gray;
          if (gray > max) max = gray;
        }
        const contraste = (max - min) / 255;

        // ========== RUIDO ==========
        let mean = 0;
        for (let i = 0; i < data.length; i += 4) {
          mean += (data[i] + data[i + 1] + data[i + 2]) / 3;
        }
        mean = mean / (data.length / 4);

        let variance = 0;
        for (let i = 0; i < data.length; i += 4) {
          const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
          variance += (gray - mean) ** 2;
        }
        const ruido = Math.sqrt(variance / (data.length / 4)) / 255;

        // ========== VALIDACIÓN ==========
        const problemas = [];
        let esValido = true;

        // Resolución
        if (img.width < ESTANDARES.RESOLUCION_MINIMA) {
          problemas.push(`Resolución muy baja (${img.width}px). Mínimo: ${ESTANDARES.RESOLUCION_MINIMA}px`);
          esValido = false;
        }

        // Nitidez
        if (nitidez < ESTANDARES.NITIDEZ_MINIMA) {
          problemas.push(`Imagen borrosa (nitidez: ${Math.round(nitidez)}). Toma la foto sin movimiento`);
          esValido = false;
        }

        // Contraste
        if (contraste < ESTANDARES.CONTRASTE_MINIMO) {
          problemas.push('Contraste muy bajo. Usa mejor iluminación');
          esValido = false;
        }

        // Ruido
        if (ruido > ESTANDARES.RUIDO_MAXIMO) {
          problemas.push('Imagen con demasiado ruido o pixelado');
          esValido = false;
        }

        // Tamaño
        const tamanoKB = file.size / 1024;
        if (tamanoKB < ESTANDARES.TAMANO_MINIMO_KB) {
          problemas.push(`Archivo muy comprimido (${Math.round(tamanoKB)}KB)`);
          esValido = false;
        }

        URL.revokeObjectURL(url);

        resolve({
          esValido,
          nivel: esValido ? 'optimo' : 'rechazado',
          metricas: {
            resolucion: img.width,
            nitidez: Math.round(nitidez),
            contraste: Math.round(contraste * 100) / 100,
            ruido: Math.round(ruido * 100) / 100,
            tamanoKB: Math.round(tamanoKB),
          },
          problemas,
        });
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
 */
const analizarPDF = async (file) => {
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
      
      // Convertir canvas a blob
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const imagenPagina = new File([blob], `pagina_${pageNum}.png`, { type: 'image/png' });
      
      // Analizar esta página
      const resultado = await analizarImagen(imagenPagina);
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
 */
export const validarCalidadArchivo = async (file) => {
  if (file.type === 'application/pdf') {
    return await analizarPDF(file);
  } else if (file.type.startsWith('image/')) {
    return await analizarImagen(file);
  } else {
    return {
      esValido: false,
      nivel: 'rechazado',
      metricas: null,
      problemas: ['Tipo de archivo no soportado'],
    };
  }
};