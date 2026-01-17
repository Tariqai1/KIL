// src/components/UrduEditor/UIHelpers.jsx
import React, { useState } from 'react';

// --- 1. Tooltip Component ---
export const Tooltip = ({ text, children }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative flex items-center justify-center" 
         onMouseEnter={() => setShow(true)} 
         onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute top-full mt-1 px-2 py-1 bg-[#333] text-white text-[10px] rounded shadow-sm whitespace-nowrap z-50 pointer-events-none">
          {text}
        </div>
      )}
    </div>
  );
};

// --- 2. Toolbar Separator ---
export const ToolbarSeparator = () => (
  <div className="w-px h-5 bg-gray-300 mx-1 self-center"></div>
);

// --- 3. Toolbar Button (Icon Button) ---
export const ToolbarButton = ({ icon: Icon, onClick, isActive, label, disabled, className }) => (
  <Tooltip text={label}>
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-1.5 rounded-[2px] transition-all duration-100 flex items-center justify-center
        ${isActive 
          ? 'bg-[#c3d6f0] text-[#2b579a] border border-[#a2bfe9]' 
          : 'text-gray-600 hover:bg-[#e1dfdd] border border-transparent'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${className || ''}
      `}
    >
      <Icon size={16} strokeWidth={1.5} />
    </button>
  </Tooltip>
);

// --- 4. Menu Dropdown (File, Edit, View, etc.) ---
export const MenuDropdown = ({ label, items }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative" onMouseLeave={() => setIsOpen(false)}>
      <button 
        onMouseEnter={() => setIsOpen(true)}
        className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-200 rounded-sm cursor-default"
      >
        {label}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 min-w-[160px] bg-white shadow-xl border border-gray-200 py-1 z-50 text-sm animate-in fade-in duration-75">
          {items.map((item, idx) => (
            <button 
              key={idx}
              onClick={() => { item.action(); setIsOpen(false); }}
              className="w-full text-left px-4 py-1.5 hover:bg-[#e1dfdd] text-gray-800 flex justify-between items-center group"
            >
              <span>{item.label}</span>
              {item.shortcut && <span className="text-gray-400 text-xs ml-4">{item.shortcut}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};