'use client';

import React from 'react';

interface ModernFileInputProps {
  accept?: string;
  onChange: (file: File | null) => void;
  children: React.ReactNode;
  className?: string;
}

export const ModernFileInput: React.FC<ModernFileInputProps> = ({
  accept = 'image/jpeg,image/png,image/gif',
  onChange,
  children,
  className = ''
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange(file);
  };

  return (
    <label className={className}>
      {children}
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
      />
    </label>
  );
};
