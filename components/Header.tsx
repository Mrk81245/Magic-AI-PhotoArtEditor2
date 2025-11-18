
import React from 'react';
import { CameraIcon } from './icons';

export const Header: React.FC = () => {
  return (
    <header className="w-full bg-gray-800/50 backdrop-blur-sm p-4 border-b border-gray-700 shadow-lg sticky top-0 z-20">
      <div className="max-w-7xl mx-auto flex items-center justify-center">
        <CameraIcon className="w-8 h-8 text-indigo-400 mr-3" />
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          <span className="text-indigo-400">AI</span> Editor Foto Pro
        </h1>
      </div>
    </header>
  );
};