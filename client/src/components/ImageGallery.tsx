import { useState } from 'react';

interface ImageGalleryProps {
  images: string[];
  title?: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [imageLoading, setImageLoading] = useState<Set<number>>(new Set());

  if (!images || images.length === 0) {
    return null;
  }

  const handleImageError = (index: number) => {
    console.error('Image failed to load:', images[index]);
    setImageErrors(prev => new Set(prev).add(index));
    setImageLoading(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  };

  const handleImageLoad = (index: number) => {
    console.log('Image loaded successfully:', images[index]);
    setImageErrors(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
    setImageLoading(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  };

  const handleImageStart = (index: number) => {
    setImageLoading(prev => new Set(prev).add(index));
  };

  // Filter out images that failed to load
  const validImages = images.filter((_, index) => !imageErrors.has(index));

  if (validImages.length === 0) {
    return (
      <div className="mt-4">
        {title && (
          <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
        )}
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 text-sm">Images could not be loaded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {title && (
        <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
      )}
      <div className={`grid gap-2 ${
        validImages.length === 1 
          ? 'grid-cols-1' 
          : validImages.length === 2 
          ? 'grid-cols-2' 
          : 'grid-cols-2'
      }`}>
        {images.map((image, index) => {
          if (imageErrors.has(index)) {
            return (
              <div key={index} className="relative">
                <div className="w-full h-48 bg-red-100 border-2 border-red-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-8 h-8 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-red-500 text-xs">Failed to load</p>
                  </div>
                </div>
              </div>
            );
          }
          
          return (
            <div key={index} className="relative group">
              {imageLoading.has(index) && (
                <div className="absolute inset-0 bg-gray-200 rounded-lg flex items-center justify-center z-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              )}
              <img
                src={image}
                alt={`Post image ${index + 1}`}
                className="w-full h-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity bg-gray-200 border border-gray-300"
                onClick={() => window.open(image, '_blank')}
                onError={() => {
                  console.error('ImageGallery image failed:', image);
                  handleImageError(index);
                }}
                onLoad={() => {
                  console.log('ImageGallery image loaded:', image);
                  handleImageLoad(index);
                }}
                onLoadStart={() => {
                  console.log('ImageGallery image loading started:', image);
                  handleImageStart(index);
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
