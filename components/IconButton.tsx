import React from 'react';

interface IconButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  tooltip: string; // Keep for desktop compatibility and accessibility
}

const IconButton: React.FC<IconButtonProps> = ({ onClick, disabled = false, children, tooltip }) => {
  return (
    <div className="relative group flex items-center">
      <button
        onClick={onClick}
        disabled={disabled}
        title={tooltip} // Use native title for tooltip
        className="p-3 bg-gray-700/50 rounded-full text-gray-300 hover:bg-indigo-600 hover:text-white disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
      >
        <div className="w-5 h-5 mx-auto">{children}</div>
      </button>
    </div>
  );
};

export default React.memo(IconButton);