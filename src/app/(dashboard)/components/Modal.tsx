import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
  overflowVisible?: boolean;
}

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = "max-w-md",
  overflowVisible = false
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-hidden">
      <div className={`bg-gray-50 rounded-lg shadow-xl w-full ${maxWidth} flex flex-col max-h-[90dvh]`}>
        <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
          <h3 className="text-lg font-semibold pr-4 truncate">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 flex-shrink-0 text-xl leading-none">
            ✕
          </button>
        </div>
        <div className={`p-4 flex-1 ${overflowVisible ? 'overflow-visible' : 'overflow-y-auto'}`}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}


