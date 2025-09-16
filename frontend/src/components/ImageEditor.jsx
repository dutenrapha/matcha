import React, { useState, useRef, useEffect } from 'react';
import './ImageEditor.css';

const ImageEditor = ({ 
  imageUrl, 
  onSave, 
  onCancel, 
  isOpen = false 
}) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [sepia, setSepia] = useState(0);
  const [hue, setHue] = useState(0);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Filtros predefinidos
  const presets = {
    original: { brightness: 100, contrast: 100, saturation: 100, blur: 0, sepia: 0, hue: 0 },
    vintage: { brightness: 90, contrast: 110, saturation: 80, blur: 0, sepia: 20, hue: 0 },
    blackwhite: { brightness: 100, contrast: 120, saturation: 0, blur: 0, sepia: 0, hue: 0 },
    warm: { brightness: 110, contrast: 100, saturation: 120, blur: 0, sepia: 10, hue: 10 },
    cool: { brightness: 90, contrast: 100, saturation: 80, blur: 0, sepia: 0, hue: -20 },
    dramatic: { brightness: 80, contrast: 130, saturation: 110, blur: 0, sepia: 5, hue: 0 }
  };

  // Aplicar filtros à imagem
  const applyFilters = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    
    if (!img || !canvas) return;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Salvar estado do contexto
    ctx.save();
    
    // Aplicar transformações
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.translate(position.x, position.y);
    
    // Aplicar filtros CSS
    const filterString = `
      brightness(${brightness}%) 
      contrast(${contrast}%) 
      saturate(${saturation}%) 
      blur(${blur}px) 
      sepia(${sepia}%) 
      hue-rotate(${hue}deg)
    `;
    
    ctx.filter = filterString;
    
    // Desenhar imagem centralizada
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    const maxWidth = canvas.width * 0.8;
    const maxHeight = canvas.height * 0.8;
    
    let drawWidth = imgWidth;
    let drawHeight = imgHeight;
    
    // Redimensionar se necessário
    if (drawWidth > maxWidth || drawHeight > maxHeight) {
      const ratio = Math.min(maxWidth / drawWidth, maxHeight / drawHeight);
      drawWidth *= ratio;
      drawHeight *= ratio;
    }
    
    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    
    // Restaurar estado do contexto
    ctx.restore();
  };

  // Carregar imagem
  useEffect(() => {
    if (imageUrl && isOpen) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageRef.current = img;
        
        // Configurar canvas
        const canvas = canvasRef.current;
        canvas.width = 600;
        canvas.height = 400;
        
        // Resetar valores
        setRotation(0);
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
        setBlur(0);
        setSepia(0);
        setHue(0);
        setScale(1);
        setPosition({ x: 0, y: 0 });
        
        applyFilters();
      };
      img.src = imageUrl;
    }
  }, [imageUrl, isOpen]);

  // Aplicar filtros quando valores mudarem
  useEffect(() => {
    if (imageRef.current) {
      applyFilters();
    }
  }, [rotation, brightness, contrast, saturation, blur, sepia, hue, scale, position]);

  // Aplicar preset
  const applyPreset = (presetName) => {
    const preset = presets[presetName];
    setBrightness(preset.brightness);
    setContrast(preset.contrast);
    setSaturation(preset.saturation);
    setBlur(preset.blur);
    setSepia(preset.sepia);
    setHue(preset.hue);
  };

  // Rotacionar imagem
  const rotateImage = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Handlers de mouse para arrastar
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Salvar imagem editada
  const saveImage = () => {
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL('image/jpeg', 0.9);
    onSave(dataURL);
  };

  // Resetar edições
  const resetEdits = () => {
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlur(0);
    setSepia(0);
    setHue(0);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  if (!isOpen) return null;

  return (
    <div className="image-editor-overlay">
      <div className="image-editor">
        <div className="editor-header">
          <h3>✏️ Editor de Imagem</h3>
          <div className="header-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={resetEdits}
            >
              🔄 Resetar
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onCancel}
            >
              ❌ Cancelar
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={saveImage}
            >
              💾 Salvar
            </button>
          </div>
        </div>

        <div className="editor-content">
          {/* Canvas de preview */}
          <div className="canvas-container">
            <canvas
              ref={canvasRef}
              className="editor-canvas"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            <div className="canvas-overlay">
              <button 
                type="button" 
                className="rotate-btn"
                onClick={rotateImage}
                title="Rotacionar 90°"
              >
                🔄
              </button>
            </div>
          </div>

          {/* Controles */}
          <div className="editor-controls">
            {/* Filtros predefinidos */}
            <div className="control-group">
              <label>Filtros Predefinidos</label>
              <div className="preset-buttons">
                {Object.keys(presets).map(preset => (
                  <button
                    key={preset}
                    type="button"
                    className="preset-btn"
                    onClick={() => applyPreset(preset)}
                  >
                    {preset.charAt(0).toUpperCase() + preset.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Controles de ajuste */}
            <div className="control-group">
              <label>Brilho: {brightness}%</label>
              <input
                type="range"
                min="0"
                max="200"
                value={brightness}
                onChange={(e) => setBrightness(parseInt(e.target.value))}
                className="slider"
              />
            </div>

            <div className="control-group">
              <label>Contraste: {contrast}%</label>
              <input
                type="range"
                min="0"
                max="200"
                value={contrast}
                onChange={(e) => setContrast(parseInt(e.target.value))}
                className="slider"
              />
            </div>

            <div className="control-group">
              <label>Saturação: {saturation}%</label>
              <input
                type="range"
                min="0"
                max="200"
                value={saturation}
                onChange={(e) => setSaturation(parseInt(e.target.value))}
                className="slider"
              />
            </div>

            <div className="control-group">
              <label>Desfoque: {blur}px</label>
              <input
                type="range"
                min="0"
                max="10"
                value={blur}
                onChange={(e) => setBlur(parseInt(e.target.value))}
                className="slider"
              />
            </div>

            <div className="control-group">
              <label>Sépia: {sepia}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={sepia}
                onChange={(e) => setSepia(parseInt(e.target.value))}
                className="slider"
              />
            </div>

            <div className="control-group">
              <label>Matiz: {hue}°</label>
              <input
                type="range"
                min="-180"
                max="180"
                value={hue}
                onChange={(e) => setHue(parseInt(e.target.value))}
                className="slider"
              />
            </div>

            <div className="control-group">
              <label>Zoom: {Math.round(scale * 100)}%</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="slider"
              />
            </div>
          </div>
        </div>

        <div className="editor-footer">
          <p>💡 Dica: Arraste a imagem para reposicioná-la</p>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
