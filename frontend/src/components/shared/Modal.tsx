import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}

export function Modal({ isOpen, onClose, title, children, width = 'max-w-lg' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`relative ${width} w-full mx-4 bg-bg-secondary border border-border overflow-hidden`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-[10px] font-mono font-medium text-text-secondary uppercase tracking-[0.2em]">{title}</h3>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-accent transition-colors duration-[80ms] text-lg leading-none"
          >
            &times;
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
