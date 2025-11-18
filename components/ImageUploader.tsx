
import React, { useRef } from 'react';
import { UploadIcon } from './icons';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="text-center w-full max-w-lg">
      <div
        onClick={handleClick}
        className="mt-1 flex justify-center px-6 pt-10 pb-12 border-2 border-gray-600 border-dashed rounded-xl cursor-pointer hover:border-indigo-500 transition-colors duration-300 bg-gray-800/50"
      >
        <div className="space-y-2">
          <UploadIcon className="mx-auto h-16 w-16 text-gray-500" />
          <div className="flex text-lg text-gray-400">
            <span className="font-semibold text-indigo-400">Carica un file</span>
            <p className="pl-1">o trascinalo qui</p>
          </div>
          <p className="text-sm text-gray-500">PNG, JPG, GIF fino a 10MB</p>
          <input
            ref={fileInputRef}
            id="file-upload"
            name="file-upload"
            type="file"
            className="sr-only"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
      </div>
       <p className="mt-6 text-sm text-gray-400">
        Con la potenza di Gemini Nano Banana
      </p>
    </div>
  );
};