import React, { useState } from 'react';
import PhotoGallery from './PhotoGallery';
import ImageEditor from './ImageEditor';
import './PhotoGallery.css';
import './ImageEditor.css';

const PhotoGalleryDemo = () => {
  const [photos, setPhotos] = useState([]);
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const handlePhotosChange = (newPhotos) => {
    setPhotos(newPhotos);
    console.log('Fotos atualizadas:', newPhotos);
  };

  const handleEditPhoto = (photo) => {
    setEditingPhoto(photo);
    setIsEditorOpen(true);
  };

  const handleSaveEditedPhoto = (editedImageUrl) => {
    const updatedPhotos = photos.map(photo => 
      photo.id === editingPhoto.id 
        ? { ...photo, url: editedImageUrl }
        : photo
    );
    setPhotos(updatedPhotos);
    setIsEditorOpen(false);
    setEditingPhoto(null);
    alert('Foto editada com sucesso!');
  };

  const handleCancelEdit = () => {
    setIsEditorOpen(false);
    setEditingPhoto(null);
  };

  const handleSetAvatar = (photoId) => {
    const updatedPhotos = photos.map(photo => ({
      ...photo,
      isAvatar: photo.id === photoId
    }));
    setPhotos(updatedPhotos);
    alert('Avatar atualizado!');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>📸 Demonstração da Galeria de Fotos</h1>
      <p>Esta é uma demonstração dos novos componentes de galeria de fotos e editor de imagens.</p>
      
      <div style={{ marginBottom: '30px' }}>
        <h2>Funcionalidades:</h2>
        <ul>
          <li>✅ Drag and drop para adicionar fotos</li>
          <li>✅ Reordenação de fotos via drag and drop</li>
          <li>✅ Definição de avatar</li>
          <li>✅ Editor de imagens com filtros</li>
          <li>✅ Rotação, brilho, contraste, saturação</li>
          <li>✅ Filtros predefinidos (vintage, preto e branco, etc.)</li>
          <li>✅ Zoom e reposicionamento</li>
        </ul>
      </div>

      <PhotoGallery
        photos={photos}
        onPhotosChange={handlePhotosChange}
        maxPhotos={5}
        onEditPhoto={handleEditPhoto}
        onSetAvatar={handleSetAvatar}
      />

      <ImageEditor
        imageUrl={editingPhoto?.url}
        onSave={handleSaveEditedPhoto}
        onCancel={handleCancelEdit}
        isOpen={isEditorOpen}
      />

      <div style={{ marginTop: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
        <h3>Estado atual das fotos:</h3>
        <pre style={{ background: 'white', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
          {JSON.stringify(photos, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default PhotoGalleryDemo;
