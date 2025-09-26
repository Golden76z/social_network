'use client';

import React from 'react';

interface AvatarFileInputProps {
  onChange: (file: File | null) => void;
  onError: (title: string, message: string) => void;
}

export const AvatarFileInput: React.FC<AvatarFileInputProps> = ({
  onChange,
  onError
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (!file) return;
    
    // Validate file type
    if (!/^image\/(jpeg|jpg|png|gif)$/i.test(file.type)) {
      onError(
        'Format non supporté',
        'Veuillez sélectionner un fichier image (JPEG, PNG ou GIF).'
      );
      return;
    }
    
    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      onError(
        'Fichier trop volumineux',
        'Le fichier doit faire moins de 5 Mo.'
      );
      return;
    }
    
    // If validation passes, call onChange
    onChange(file);
  };

  return (
    <div className="relative">
      <input
        type="file"
        accept="image/jpeg,image/png,image/gif"
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        id="avatar-file-input"
      />
      <button
        type="button"
        className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
      >
        Choose Photo
      </button>
    </div>
  );
};
