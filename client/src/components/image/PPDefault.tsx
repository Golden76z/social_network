// component/image/PpDefault.tsx

import React from 'react';

const username = '';
const letter = username.charAt(0).toUpperCase() || @;

const bgcolorRandom = (): string => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
const bgcolor = bgcolorRandom();

const PpDefault: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 35 35"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="17.5" cy="17.5" r="17.5" fill={bgcolor} />
    <text
      x="50%"
      y="50%"
      textAnchor="middle"
      dominantBaseline="central"
      fill="white"
      fontSize="16"
      fontFamily="Arial"
    >
      {letter}
    </text>
  </svg>
);

export default PpDefault;
