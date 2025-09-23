import React, { useState } from 'react';

interface ProfileThumbnailProps {
  src?: string | null;
  alt?: string;
  // size can be a preset or a pixel number
  size?: 'sm' | 'md' | 'lg' | number;
  // rounded avatar by default
  rounded?: boolean;
  className?: string;
  onClick?: () => void;
  // Fallback initials when image missing or fails to load
  initials?: string;
}

// Small, reusable avatar/thumbnail component for user profile pictures
// Keep it simple and student-friendly: use <img>, Tailwind classes, and safe fallbacks.
export const ProfileThumbnail: React.FC<ProfileThumbnailProps> = ({
  src,
  alt = 'avatar',
  size = 'md',
  rounded = true,
  className = '',
  onClick,
  initials,
}) => {
  const [hasError, setHasError] = useState(false);

  // Map preset sizes to tailwind sizing. If number, use inline style.
  const sizeClasses = typeof size === 'number' ? '' : size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-14 h-14' : 'w-10 h-10';
  const radius = rounded ? 'rounded-full' : 'rounded-md';

  // Build absolute URL if backend returns relative "/uploads/..."
  const buildUrl = (s?: string | null): string | undefined => {
    if (!s || typeof s !== 'string') return undefined;
    if (s.startsWith('http')) return s;
    const base =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      'http://localhost:8080';
    return `${base}${s}`;
  };

  const url = buildUrl(src || undefined);

  // Render fallback circle with initials if no image or image fails to load
  const Fallback = (
    <div
      className={`${sizeClasses} ${radius} bg-muted text-foreground/80 flex items-center justify-center font-medium overflow-hidden ${className}`}
      style={typeof size === 'number' ? { width: size, height: size } : undefined}
      onClick={onClick}
      aria-label={alt}
    >
      <span>{(initials && initials.charAt(0)) || 'U'}</span>
    </div>
  );

  if (!url || hasError) return Fallback;

  return (
    <div
      className={`${sizeClasses} ${radius} overflow-hidden bg-muted ${className}`}
      style={typeof size === 'number' ? { width: size, height: size } : undefined}
      onClick={onClick}
      aria-label={alt}
    >
      <img
        src={url}
        alt={alt}
        className="w-full h-full object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
};

export default ProfileThumbnail;
