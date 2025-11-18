
import React from 'react';

export const LoadingOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-500"></div>
        <p className="text-white text-xl mt-4 font-semibold">L'IA sta pensando...</p>
        <p className="text-gray-400 mt-2">Potrebbe volerci un momento.</p>
    </div>
  );
};