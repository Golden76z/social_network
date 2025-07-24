import React, { useState } from 'react';

type TripleButtonProps = {
  buttons: {
    label: string;
    onClick: () => void;
  }[];
};

const TripleButton: React.FC<TripleButtonProps> = ({ buttons }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (buttons.length !== 3) {
    console.error('Le composant TripleButton attend exactement 3 boutons.');
    return null;
  }

  return (
    <div className="flex">
      {buttons.map((btn, index) => {
        const isActive = index === activeIndex;

        return (
          <button
            key={index}
            onClick={() => {
              setActiveIndex(index);
              btn.onClick();
            }}
            className={`px-4 py-2 border border-[5px] transition-colors 
              ${isActive
                ? 'bg-chart-1 text-white border-chart-1'
                : 'bg-chart-3 text-chart-1 border-chart-1 hover:bg-chart-1 hover:text-white'}
            `}
          >
            {btn.label}
          </button>
        );
      })}
    </div>
  );
};

export default TripleButton;
