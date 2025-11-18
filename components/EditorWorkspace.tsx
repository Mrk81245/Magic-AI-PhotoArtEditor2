
import React, { useState } from 'react';
// Fix: Changed named import to default import for ControlPanel.
import ControlPanel from './ControlPanel';
import { Adjustments } from '../types';
// Fix: Changed named import to default import for IconButton.
import IconButton from './IconButton';
import { UndoIcon, RedoIcon, ResetIcon, NewFileIcon, AdjustmentsIcon, ActionsIcon, CustomEditIcon, DownloadIcon, GreetingCardIcon, LutIcon } from './icons';
import ImageComparator from './ImageComparator';

interface EditorWorkspaceProps {
  imageSrc: string;
  originalImageSrc: string;
  adjustments: Adjustments;
  onApplyEdit: (prompt: string) => void;
  onApplyAdjustments: () => void;
  hasPendingAdjustments: boolean;
  onUndo: () => void;
  canUndo: boolean;
  onRedo: () => void;
  canRedo: boolean;
  onReset: () => void;
  canReset: boolean;
  onStartNew: () => void;
  onAdjustmentsChange: (adjustments: Adjustments) => void;
  onDownload: () => void;
}

type ActivePanel = 'adjustments' | 'actions' | 'custom' | 'card' | 'lut' | null;

const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({
  imageSrc,
  originalImageSrc,
  adjustments,
  onApplyEdit,
  onApplyAdjustments,
  hasPendingAdjustments,
  onUndo,
  canUndo,
  onRedo,
  canRedo,
  onReset,
  canReset,
  onStartNew,
  onAdjustmentsChange,
  onDownload,
}) => {
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);

  const imageStyle = {
    filter: `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%) sepia(${adjustments.sepia}%) hue-rotate(${adjustments.hue}deg)`,
  };

  const TopActionBar = () => (
    <div className="absolute top-0 left-0 right-0 z-10 p-2 bg-gradient-to-b from-black/60 to-transparent lg:hidden">
        <div className="flex items-center justify-center gap-2 max-w-sm mx-auto p-1 bg-gray-900/50 rounded-full backdrop-blur-sm">
             <IconButton onClick={onUndo} disabled={!canUndo} tooltip="Annulla">
                <UndoIcon />
            </IconButton>
            <IconButton onClick={onRedo} disabled={!canRedo} tooltip="Ripeti">
                <RedoIcon />
            </IconButton>
            <IconButton onClick={onReset} disabled={!canReset} tooltip="Reset">
                <ResetIcon />
            </IconButton>
             <IconButton onClick={onDownload} tooltip="Scarica Immagine">
                <DownloadIcon />
            </IconButton>
            <IconButton onClick={onStartNew} tooltip="Nuovo Progetto">
                <NewFileIcon />
            </IconButton>
        </div>
    </div>
  );

  const BottomToolbar = () => (
     <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/60 to-transparent lg:hidden">
        <div className="flex items-center justify-around gap-1 max-w-md mx-auto p-2 bg-gray-900/80 rounded-full backdrop-blur-sm shadow-2xl">
            <BottomToolbarButton icon={<AdjustmentsIcon />} label="Regola" panel="adjustments" />
            <BottomToolbarButton icon={<ActionsIcon />} label="Azioni" panel="actions" />
            <BottomToolbarButton icon={<LutIcon />} label="LUT" panel="lut" />
            <BottomToolbarButton icon={<CustomEditIcon />} label="Modifica" panel="custom" />
            <BottomToolbarButton icon={<GreetingCardIcon />} label="Biglietto" panel="card" />
        </div>
    </div>
  );

  const BottomToolbarButton = ({icon, label, panel}: {icon: React.ReactNode, label: string, panel: ActivePanel}) => (
      <button 
        onClick={() => setActivePanel(panel)}
        className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors w-16 ${activePanel === panel ? 'text-indigo-400' : 'text-gray-300 hover:text-white'}`}
      >
        <div className="w-6 h-6">{icon}</div>
        <span>{label}</span>
      </button>
  );

  return (
    <div className="w-full h-full flex-grow flex flex-col lg:flex-row items-center lg:items-start gap-8 p-0 lg:p-4 max-w-7xl mx-auto relative">
      {/* --- Main Image Viewer --- */}
      <div className={`relative flex-grow w-full h-full flex items-center justify-center bg-black/20 lg:rounded-xl overflow-hidden shadow-2xl transition-[padding] duration-300 ease-in-out`}
        style={{ paddingBottom: activePanel ? '45vh' : '0' }}
      >
        <ImageComparator
          originalSrc={originalImageSrc}
          editedSrc={imageSrc}
          editedStyle={imageStyle}
        />

        {/* --- Mobile UI Overlays --- */}
        <TopActionBar />
        <BottomToolbar />
      </div>

      {/* --- Control Panel --- */}
      {/* This renders both the mobile drawer and the desktop sidebar */}
      <ControlPanel
        adjustments={adjustments}
        onAdjustmentsChange={onAdjustmentsChange}
        onApplyEdit={onApplyEdit}
        onApplyAdjustments={onApplyAdjustments}
        hasPendingAdjustments={hasPendingAdjustments}
        onUndo={onUndo}
        canUndo={canUndo}
        onRedo={onRedo}
        canRedo={canRedo}
        onReset={onReset}
        canReset={canReset}
        onStartNew={onStartNew}
        onDownload={onDownload}
        // Mobile-specific props
        activePanel={activePanel}
        onClosePanel={() => setActivePanel(null)}
      />
    </div>
  );
};

export default React.memo(EditorWorkspace);
