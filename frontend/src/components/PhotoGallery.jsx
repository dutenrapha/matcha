import React, { useState, useRef, useCallback } from 'react';
import './PhotoGallery.css';

const PhotoGallery = ({ 
  photos = [], 
  onPhotosChange, 
  maxPhotos = 5, 
  onEditPhoto,
  onSetAvatar 
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const fileInputRef = useRef(null);

  // Validar arquivo de imagem
  const validateFile = (file) => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Por favor, selecione apenas arquivos de imagem');
    }
    
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('A imagem deve ter no máximo 5MB');
    }
    
    return true;
  };

  // Converter arquivo para base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Adicionar nova foto
  const addPhoto = async (file) => {
    try {
      validateFile(file);
      const base64 = await fileToBase64(file);
      
      const newPhoto = {
        id: Date.now(),
        url: base64,
        isAvatar: photos.length === 0, // Primeira foto é automaticamente avatar
        order: photos.length
      };

      const updatedPhotos = [...photos, newPhoto];
      onPhotosChange(updatedPhotos);
      
      return newPhoto;
    } catch (error) {
      throw error;
    }
  };

  // Remover foto
  const removePhoto = (photoId) => {
    const updatedPhotos = photos.filter(photo => photo.id !== photoId);
    
    // Se era o avatar, definir o primeiro como novo avatar
    const removedPhoto = photos.find(photo => photo.id === photoId);
    if (removedPhoto && removedPhoto.isAvatar && updatedPhotos.length > 0) {
      updatedPhotos[0].isAvatar = true;
    }
    
    onPhotosChange(updatedPhotos);
  };

  // Definir avatar
  const setAvatar = (photoId) => {
    const updatedPhotos = photos.map(photo => ({
      ...photo,
      isAvatar: photo.id === photoId
    }));
    onPhotosChange(updatedPhotos);
    onSetAvatar && onSetAvatar(photoId);
  };

  // Reordenar fotos via drag and drop
  const movePhoto = (fromIndex, toIndex) => {
    const updatedPhotos = [...photos];
    const [movedPhoto] = updatedPhotos.splice(fromIndex, 1);
    updatedPhotos.splice(toIndex, 0, movedPhoto);
    
    // Atualizar ordem
    const reorderedPhotos = updatedPhotos.map((photo, index) => ({
      ...photo,
      order: index
    }));
    
    onPhotosChange(reorderedPhotos);
  };

  // Handlers de drag and drop
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOver(false);
    }
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    setDragOver(false);
    
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      movePhoto(draggedIndex, dropIndex);
    }
    
    setDraggedIndex(null);
  };

  // Handlers de upload
  const handleFileSelect = async (files) => {
    const fileArray = Array.from(files);
    const remainingSlots = maxPhotos - photos.length;
    const filesToProcess = fileArray.slice(0, remainingSlots);
    
    try {
      for (const file of filesToProcess) {
        await addPhoto(file);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDropFiles = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
    // Limpar input para permitir selecionar o mesmo arquivo novamente
    e.target.value = '';
  };

  // Abrir seletor de arquivos
  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="photo-gallery">
      <div className="gallery-header">
        <h3>📸 Galeria de Fotos</h3>
        <p>Adicione até {maxPhotos} fotos. Arraste para reordenar.</p>
      </div>

      <div 
        className={`gallery-container ${dragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDropFiles}
      >
        {/* Grid de fotos existentes */}
        <div className="photos-grid">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className={`photo-item ${photo.isAvatar ? 'avatar' : ''} ${draggedIndex === index ? 'dragging' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
            >
              <div className="photo-wrapper">
                <img src={photo.url} alt={`Foto ${index + 1}`} />
                
                {/* Overlay com controles */}
                <div className="photo-overlay">
                  <div className="photo-actions">
                    <button
                      type="button"
                      className="action-btn edit-btn"
                      onClick={() => onEditPhoto && onEditPhoto(photo)}
                      title="Editar foto"
                    >
                      ✏️
                    </button>
                    
                    {!photo.isAvatar && (
                      <button
                        type="button"
                        className="action-btn avatar-btn"
                        onClick={() => setAvatar(photo.id)}
                        title="Definir como avatar"
                      >
                        👑
                      </button>
                    )}
                    
                    <button
                      type="button"
                      className="action-btn remove-btn"
                      onClick={() => removePhoto(photo.id)}
                      title="Remover foto"
                    >
                      🗑️
                    </button>
                  </div>
                  
                  {photo.isAvatar && (
                    <div className="avatar-badge">
                      <span>👑</span>
                      <small>Avatar</small>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Slot para adicionar nova foto */}
        {photos.length < maxPhotos && (
          <div 
            className="add-photo-slot"
            onClick={openFileSelector}
          >
            <div className="add-photo-content">
              <span className="add-icon">📷</span>
              <p>Adicionar Foto</p>
              <small>Clique ou arraste aqui</small>
            </div>
          </div>
        )}
      </div>

      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {/* Estatísticas */}
      <div className="gallery-stats">
        <span>{photos.length} de {maxPhotos} fotos</span>
        {photos.length > 0 && (
          <span className="avatar-info">
            Avatar: Foto {photos.findIndex(p => p.isAvatar) + 1}
          </span>
        )}
      </div>
    </div>
  );
};

export default PhotoGallery;
