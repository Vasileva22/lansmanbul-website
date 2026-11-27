// Браузер: уменьшить фото перед загрузкой (длинная сторона до 1920 px, JPEG ~82%).
// Заодно убирает метаданные EXIF (в том числе GPS из телефона).
export async function compressImage(file, { maxSide = 1920, quality = 0.82 } = {}) {
  if (!file.type.startsWith('image/')) throw new Error('Sadece fotoğraf yükleyebilirsiniz');
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error(`${file.name}: bu fotoğraf açılamadı (JPG veya PNG deneyin)`);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  if (Math.min(w, h) < 500) throw new Error(`${file.name}: fotoğraf çok küçük (en az 800 px genişlik önerilir)`);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', quality));
  if (!blob) throw new Error(`${file.name}: sıkıştırılamadı`);
  return blob;
}
