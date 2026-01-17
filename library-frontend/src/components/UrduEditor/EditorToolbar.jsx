// src/components/UrduEditor/EditorToolbar.jsx
import React from 'react';

const EditorToolbar = () => {
  
  // --- Command Handler ---
  const formatDoc = (cmd, value = null) => {
    if (value === 'prompt-image') {
      const url = prompt('Enter Image URL:');
      if (url) document.execCommand('insertImage', false, url);
    } else {
      document.execCommand(cmd, false, value);
    }
    const editor = document.getElementById('editor-content-area');
    if (editor) editor.focus();
  };

  // --- Compact Styles ---
  // h-7 w-7 (28px) ensures buttons are very small. Text is xs (12px).
  const btnBase = "h-7 w-7 flex items-center justify-center rounded hover:bg-gray-200 text-gray-700 transition-colors focus:outline-none text-xs";
  const selectBase = "h-7 px-1 text-[11px] border border-gray-300 rounded bg-white hover:border-gray-400 focus:border-blue-500 outline-none text-gray-700 cursor-pointer";
  const divider = <div className="w-px h-4 bg-gray-300 mx-1 self-center"></div>;
  const labelClass = "flex items-center gap-1 text-[10px] text-gray-600 font-tahoma cursor-pointer select-none";

  return (
    <div className="flex items-center w-full px-2 py-1 bg-[#f3f2f1] border-b border-gray-300 shadow-sm sticky top-0 z-30 select-none overflow-x-auto whitespace-nowrap">
      
      {/* Group 1: Undo/Redo */}
      <div className="flex gap-0.5">
        <button onClick={() => formatDoc('undo')} className={btnBase} title="Undo"><i className="fas fa-undo"></i></button>
        <button onClick={() => formatDoc('redo')} className={btnBase} title="Redo"><i className="fas fa-redo"></i></button>
      </div>
      
      {divider}

      {/* Group 2: Typography */}
      <div className="flex items-center gap-1">
        {/* Font Family (Requested List) */}
        <select onChange={(e) => formatDoc('fontName', e.target.value)} className={selectBase} style={{width: '120px'}} title="Font">
          <option value="Jameel Noori Nastaleeq">Jameel Noori Nastaleeq</option>
          <option value="Noto Nastaliq Urdu">Noto Nastaliq Urdu</option>
          <option value="Noto Naskh Arabic">Noto Naskh Arabic</option>
          <option value="Tahoma">Tahoma</option>
          <option value="Arial">Arial</option>
        </select>

        {/* Font Size */}
        <select onChange={(e) => formatDoc('fontSize', e.target.value)} className={selectBase} style={{width: '45px'}} title="Size">
          <option value="3">12</option>
          <option value="1">8</option>
          <option value="2">10</option>
          <option value="4">14</option>
          <option value="5">18</option>
          <option value="6">24</option>
          <option value="7">36</option>
        </select>

        <button onClick={() => formatDoc('bold')} className={btnBase} title="Bold"><i className="fas fa-bold"></i></button>
        <button onClick={() => formatDoc('italic')} className={btnBase} title="Italic"><i className="fas fa-italic"></i></button>
        <button onClick={() => formatDoc('underline')} className={btnBase} title="Underline"><i className="fas fa-underline"></i></button>
      </div>

      {divider}

      {/* Group 3: Formatting & Colors */}
      <div className="flex items-center gap-1">
         {/* Text Color (A with Red bar) */}
         <div className="relative group cursor-pointer" title="Text Color">
            <label htmlFor="txtColor" className={`${btnBase} flex-col !gap-0`}>
                <span className="font-bold leading-none" style={{fontSize: '10px'}}>A</span>
                <div className="h-[3px] w-3 bg-red-600 mt-[1px]"></div>
            </label>
            <input type="color" id="txtColor" className="absolute opacity-0 inset-0 cursor-pointer w-full h-full" onChange={(e) => formatDoc('foreColor', e.target.value)} />
         </div>
         
         <button onClick={() => formatDoc('removeFormat')} className={`${btnBase} text-red-500`} title="Clear Format"><i className="fas fa-eraser"></i></button>
      </div>

      {divider}

      {/* Group 4: Alignment & Direction (Requested: Raast/LTR) */}
      <div className="flex gap-0.5">
        <button onClick={() => formatDoc('justifyRight')} className={`${btnBase} bg-blue-50 text-blue-700 border border-blue-200`} title="Raast (Right)">
            <span className="text-[10px] font-bold mr-1">راست</span> <i className="fas fa-align-right"></i>
        </button>
        <button onClick={() => formatDoc('justifyLeft')} className={btnBase} title="LTR (Left)">
            <span className="text-[10px] font-bold mr-1">LTR</span> <i className="fas fa-align-left"></i>
        </button>
        <button onClick={() => formatDoc('justifyCenter')} className={btnBase} title="Center"><i className="fas fa-align-center"></i></button>
        <button onClick={() => formatDoc('justifyFull')} className={btnBase} title="Justify"><i className="fas fa-align-justify"></i></button>
      </div>
      
      {divider}

      {/* Group 5: Inserts */}
      <div className="flex gap-0.5">
        <button onClick={() => formatDoc('insertUnorderedList')} className={btnBase} title="Bullet"><i className="fas fa-list-ul"></i></button>
        <button onClick={() => formatDoc('insertOrderedList')} className={btnBase} title="Number"><i className="fas fa-list-ol"></i></button>
        <button onClick={() => formatDoc('prompt-image')} className={btnBase} title="Image"><i className="far fa-image"></i></button>
        <button onClick={() => {
            const link = prompt('URL:');
            if(link) formatDoc('createLink', link);
         }} className={btnBase} title="Link"><i className="fas fa-link"></i></button>
      </div>

      {divider}

      {/* Group 6: Extras (Tashkil / Autosave) */}
      <div className="flex items-center gap-3 ml-auto px-2">
        <label className={labelClass}>
            <input type="checkbox" className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-0" />
            <span>تـشکیل (Tashkil)</span>
        </label>
        
        <label className={labelClass}>
            <input type="checkbox" defaultChecked className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-0" />
            <span>Autosave</span>
        </label>
      </div>

    </div>
  );
};

export default EditorToolbar;