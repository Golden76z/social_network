// component/image/PpDefault.tsx

import React from 'react';

const PpDefault: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 35 35"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="17.5" cy="17.5" r="17.5" fill="#6A5ACD" />
    <text
      x="50%"
      y="50%"
      textAnchor="middle"
      dominantBaseline="central"
      fill="white"
      fontSize="16"
      fontFamily="Arial"
    >
      B
    </text>
  </svg>
);

export default PpDefault;
