import React from 'react';

type TripleButtonProps = {
  buttons: {
    label: string;
    onClick: () => void;
  }[];
};

const TripleButton: React.FC<TripleButtonProps> = ({ buttons }) => {
  if (buttons.length !== 3) {
    console.error("Le composant TripleButton attend exactement 3 boutons.");
    return null;
  }

  return (
    <div style={{ display: 'flex' }}>
      {buttons.map((btn, index) => (
        <button
          key={index}
          onClick={btn.onClick}
          className={`px-4 py-2 border border-[5px] transition-colors
            ${index === 0
              ? 'bg-chart-1 text-white border-chart-1'
              : 'bg-chart-3 text-chart-1 border-chart-1 hover:bg-chart-1 hover:text-white'}
          `}

        >
          {btn.label}
        </button>
      ))}
    </div>
  );
};

export default TripleButton;
