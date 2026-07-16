```javascript
import { useEffect } from 'react';

export default function Lightbox({ photos, activeIndex, onClose, onPrev, onRight }) {
  
  // Управление перелистыванием с клавиатуры (стрелочки и Esc)
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onRight();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onRight]);

  if (!photos || photos.length === 0) return null;

  return (
    <div className="custom-lightbox-overlay active" onClick={onClose}>
      <span className="custom-lightbox-close" onClick={onClose}>&times;</span>
      
      <div className="lightbox-slider-container" onClick={(e) => e.stopPropagation()}>
        <div className="lightbox-slide">
          <img src={photos[activeIndex]} alt="Büyük Görsel" />
        </div>

        {/* Стрелки отображаем только если фото больше одного */}
        {photos.length > 1 && (
          <>
            <div className="lightbox-arrow lightbox-arrow-left" onClick={onPrev}>❮</div>
            <div className="lightbox-arrow lightbox-arrow-right" onClick={onRight}>❯</div>
          </>
        )}
      </div>

      <div className="lightbox-counter">
        {activeIndex + 1} / {photos.length}
      </div>
    </div>
  );
}
```
