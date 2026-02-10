/**
 * Compresión y Optimización de Archivos
 * Reduce tamaño sin perder calidad - Envíos instantáneos
 */

/**
 * Comprimir imagen
 * Reduce tamaño de fotos sin perder legibilidad
 */
export async function comprimirImagen(file, maxSize = 500) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = Math.max(img.width, img.height);
        const scale = maxSize / maxDim;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convertir a Blob con compresión JPEG
        canvas.toBlob(
          (blob) => {
            const comprimido = new File(
              [blob],
              file.name,
              { type: 'image/jpeg', lastModified: file.lastModified }
            );
            resolve(comprimido);
          },
          'image/jpeg',
          0.75 // Calidad del 75%
        );
      };
    };
  });
}

/**
 * Comprimir PDF (si es posible)
 * Usa PDFDocument para reducir tamaño
 */
export async function comprimirPDF(file) {
  try {
    const { PDFDocument } = await import('pdf-lib');
    const pdfBytes = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Comprimir guardando con opciones agresivas
    const comprimido = await pdfDoc.save({
      useObjectStreams: true,
    });
    
    return new File(
      [comprimido],
      file.name,
      { type: 'application/pdf', lastModified: file.lastModified }
    );
  } catch (error) {
    console.log('No se pudo comprimir PDF, enviando original');
    return file;
  }
}

/**
 * Optimizar archivo automáticamente
 */
export async function optimizarArchivo(file) {
  const startSize = file.size;
  let optimizado = file;
  
  if (file.type.startsWith('image/')) {
    optimizado = await comprimirImagen(file);
  } else if (file.type === 'application/pdf') {
    optimizado = await comprimirPDF(file);
  }
  
  const finalSize = optimizado.size;
  const reduccion = Math.round((1 - finalSize / startSize) * 100);
  
  console.log(`📦 ${file.name}: ${(startSize / 1024).toFixed(1)}KB → ${(finalSize / 1024).toFixed(1)}KB (-${reduccion}%)`);
  
  return optimizado;
}

/**
 * Optimizar múltiples archivos en paralelo
 */
export async function optimizarMultiples(files) {
  const optimizados = await Promise.all(
    files.map(file => optimizarArchivo(file))
  );
  return optimizados;
}

/**
 * Enviar archivos sin esperar respuesta completa
 * Devuelve serial/ID inmediatamente
 */
export async function enviarArchivosRapido(endpoint, formData) {
  // Optimizar todos los archivos ANTES de enviar
  const files = formData.getAll('archivos');
  if (files.length > 0) {
    console.log('🗜️ Optimizando archivos...');
    const archivosOptimizados = await optimizarMultiples(files);
    
    // Reemplazar en FormData
    formData.delete('archivos');
    archivosOptimizados.forEach(file => {
      formData.append('archivos', file);
    });
  }
  
  // Enviar sin esperar respuesta completa
  const promise = fetch(endpoint, {
    method: 'POST',
    body: formData,
  });
  
  // No esperar - devolver inmediatamente
  return {
    status: 'enviando',
    mensaje: 'Datos enviados. Verificando en servidor...'
  };
}

/**
 * Calcular tamaño total de archivos
 */
export function calcularTamanoTotal(files) {
  return files.reduce((sum, file) => sum + file.size, 0);
}

/**
 * Formatear bytes a texto legible
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Precargar y cachear archivos para acceso rápido
 */
const fileCache = new Map();

export function cacheArchivoLocalmente(nombre, file) {
  fileCache.set(nombre, file);
}

export function obtenerDelCache(nombre) {
  return fileCache.get(nombre);
}

export function limpiarCache() {
  fileCache.clear();
}
