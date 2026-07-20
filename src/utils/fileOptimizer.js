/**
 * Optimización de archivos ANTES de subir — IncaNeurobaeza 2026
 *
 * Objetivo: que el envío sea rápido incluso con internet lento,
 * SIN dañar la legibilidad ni la calidad útil del documento.
 *
 * Reglas de seguridad (nunca se rompe un archivo):
 * - Imágenes: solo se optimizan si pesan > 500 KB. Se redimensionan a máx
 *   2000 px (más que suficiente para OCR y lectura médica) con JPEG calidad 85.
 *   Si el resultado no es más liviano que el original → se envía el original.
 * - PDFs: solo compresión ESTRUCTURAL SIN PÉRDIDA (object streams). El contenido
 *   visual queda idéntico. Si no reduce, se envía el original.
 * - Cualquier error → se envía el archivo original tal cual.
 */

const IMG_MAX_DIM = 2000;        // px — conserva legibilidad total para OCR
const IMG_QUALITY = 0.85;        // JPEG q85 — visualmente idéntico
const IMG_MIN_BYTES = 500 * 1024;      // no tocar imágenes ya livianas
const PDF_MIN_BYTES = 2 * 1024 * 1024; // no tocar PDFs ya livianos

function esImagen(file) {
  return /^image\/(jpe?g|png|webp|heic|heif)$/i.test(file.type || '');
}

function esPDF(file) {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');
}

/** Optimiza una imagen manteniendo legibilidad total. Fail-safe: retorna el original. */
export async function comprimirImagen(file) {
  if (file.size < IMG_MIN_BYTES) return file;
  try {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = dataUrl;
    });

    const maxDim = Math.max(img.width, img.height);
    const scale = maxDim > IMG_MAX_DIM ? IMG_MAX_DIM / maxDim : 1; // nunca agrandar

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', IMG_QUALITY)
    );

    if (!blob || blob.size >= file.size) return file; // solo si realmente reduce

    const nombre = (file.name || 'imagen').replace(/\.(png|webp|heic|heif)$/i, '.jpg');
    console.log(
      `📉 Imagen optimizada: ${file.name} ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(blob.size / 1024 / 1024).toFixed(2)}MB`
    );
    return new File([blob], nombre, { type: 'image/jpeg', lastModified: file.lastModified });
  } catch (err) {
    console.warn('⚠️ No se pudo optimizar imagen, se envía original:', err);
    return file;
  }
}

/** Compresión SIN PÉRDIDA de PDF (object streams). Fail-safe: retorna el original. */
export async function comprimirPDF(file) {
  if (file.size < PDF_MIN_BYTES) return file;
  try {
    const { PDFDocument } = await import('pdf-lib');
    const pdfBytes = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const comprimido = await pdfDoc.save({ useObjectStreams: true });

    if (comprimido.byteLength >= file.size) return file; // solo si reduce

    console.log(
      `📉 PDF optimizado (sin pérdida): ${file.name} ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(comprimido.byteLength / 1024 / 1024).toFixed(2)}MB`
    );
    return new File([comprimido], file.name, {
      type: 'application/pdf',
      lastModified: file.lastModified,
    });
  } catch (err) {
    console.warn('⚠️ No se pudo optimizar PDF, se envía original:', err);
    return file;
  }
}

/**
 * Punto de entrada: optimiza cualquier archivo para envío.
 * Siempre retorna un archivo válido (el optimizado o el original).
 */
export async function optimizarArchivo(file) {
  if (esImagen(file)) return comprimirImagen(file);
  if (esPDF(file)) return comprimirPDF(file);
  return file; // otros tipos: sin cambios
}

/** Optimiza una lista de archivos en paralelo. */
export async function optimizarMultiples(files) {
  return Promise.all(files.map((f) => optimizarArchivo(f)));
}
