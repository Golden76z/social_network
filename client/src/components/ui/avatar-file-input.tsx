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
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (!file) return;
    
    // Clear previous error
    setError(null);
    
    // Validate file type
    if (!/^image\/(jpeg|jpg|png|gif)$/i.test(file.type)) {
      const errorMsg = 'Please select a valid image file (JPEG, PNG, or GIF).';
      setError(errorMsg);
      onError('Unsupported Format', errorMsg);
      // Reset the file input
      e.target.value = '';
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
      return;
    }
    
    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      const errorMsg = 'The file must be less than 5MB.';
      setError(errorMsg);
      onError('File Too Large', errorMsg);
      // Reset the file input
      e.target.value = '';
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
      return;
    }
    
    // If validation passes, call onChange
    onChange(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif"
          onChange={handleFileChange}
          className="hidden"
          id="avatar-file-input"
        />
        <button
          type="button"
          onClick={handleButtonClick}
          className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
        >
          Choose Photo
        </button>
      </div>
      {error && (
        <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
          {error}
        </div>
      )}
    </div>
  );
};
