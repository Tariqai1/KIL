// src/components/UrduEditor/EditorPage.jsx
import React, { useRef, useEffect, useState } from 'react';

const EditorPage = ({ content, onChange }) => {
  const editorRef = useRef(null);
  const [stats, setStats] = useState({ words: 0, chars: 0, pages: 1, currentPage: 1 });

  // --- A4 Size Calculation (Pixels) ---
  // 297mm height approx 1123px at 96 DPI
  const PAGE_HEIGHT_PX = 1123; 
  const PAGE_GAP_PX = 30;

  // --- 1. Content Sync & Stats Logic ---
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
       // Only update if content is truly different to prevent cursor jumps
       if (Math.abs(editorRef.current.innerText.length - content.replace(/<[^>]*>/g, '').length) > 5) {
          editorRef.current.innerHTML = content;
       }
    }
    calculateStats();
  }, [content]);

  const handleInput = (e) => {
    onChange(e.currentTarget.innerHTML);
    calculateStats();
  };

  const calculateStats = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || "";
    
    // Word/Char Count
    const words = text.trim().split(/\s+/).filter(w => w).length;
    const chars = text.length;

    // Page Calculation based on Height
    const totalHeight = editorRef.current.offsetHeight;
    const totalPages = Math.max(1, Math.ceil(totalHeight / PAGE_HEIGHT_PX));

    setStats(prev => ({ ...prev, words, chars, pages: totalPages }));
  };

  // --- 2. Track Current Page on Scroll ---
  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    // Calculate which page is currently in view
    const current = Math.max(1, Math.ceil((scrollTop + 300) / (PAGE_HEIGHT_PX + PAGE_GAP_PX)));
    setStats(prev => ({ ...prev, currentPage: current }));
  };

  // --- 3. Ruler (Scale) ---
  const Ruler = () => (
    <div className="h-6 bg-[#f8f9fa] border-b border-gray-300 flex items-end px-[25mm] select-none sticky top-0 z-20 shadow-sm overflow-hidden flex-shrink-0">
        <div className="w-full h-full flex items-end justify-between text-[9px] text-gray-400 pb-1">
             {[...Array(22)].map((_, i) => (
                 <div key={i} className="flex flex-col items-center gap-0.5">
                     {i % 2 === 0 && <span>{i}</span>}
                     <div className={`w-px bg-gray-300 ${i % 2 === 0 ? 'h-2' : 'h-1'}`}></div>
                 </div>
             ))}
        </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f0f2f5] relative overflow-hidden">
       
       <Ruler />

       {/* --- Scrollable Area --- */}
       <div 
         className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center py-8"
         onScroll={handleScroll}
         onClick={() => editorRef.current?.focus()}
       >
          {/* --- REALISTIC PAGE ADDITION LOGIC ---
              We use a repeating CSS gradient. 
              White for 297mm (Page) -> Gray for 30px (Gap) -> Repeat.
              This visual trick makes it look like new pages are adding up.
          */}
          <div 
             className="bg-white mx-auto relative transition-all duration-300"
             style={{
                width: '210mm',
                // Minimum 1 page, grows automatically
                minHeight: '297mm', 
                padding: '25mm 20mm', // Margins
                
                // The "Separate Pages" Visual Trick
                backgroundImage: `linear-gradient(to bottom, 
                    white 0px, 
                    white calc(100% - ${PAGE_GAP_PX}px), 
                    #d1d5db calc(100% - ${PAGE_GAP_PX}px), 
                    #f0f2f5 calc(100% - ${PAGE_GAP_PX}px + 1px), 
                    #f0f2f5 100%
                )`,
                // Repeat size = Page Height + Gap
                backgroundSize: `100% ${PAGE_HEIGHT_PX + PAGE_GAP_PX}px`,
                
                // Shadows for depth (Optional, CSS doesn't repeat shadows well on gradients, keeping it clean)
                boxShadow: '0 0 0 1px #e5e7eb' 
             }}
          >
             {/* The Typing Area */}
             <div 
                ref={editorRef}
                id="editor-content-area"
                contentEditable
                onInput={handleInput}
                className="outline-none text-right text-gray-900 w-full"
                dir="rtl"
                spellCheck="false"
                style={{ 
                    fontSize: '18px',
                    lineHeight: '1.8',
                    fontFamily: '"Jameel Noori Nastaleeq", "Noto Nastaliq Urdu", Tahoma, sans-serif',
                    minHeight: '250mm'
                }}
             />
          </div>

          {/* Page Break Visual Helper (Shows at bottom) */}
          <div className="mt-4 text-gray-400 text-xs">
             --- End of Document ---
          </div>
       </div>

       {/* --- Status Bar --- */}
       <div className="h-7 bg-white border-t border-gray-300 flex justify-between items-center px-4 text-[11px] text-gray-600 select-none shadow-[0_-2px_5px_rgba(0,0,0,0.05)] z-30">
           <div className="flex gap-4">
               <span className="font-bold text-blue-700">Page {stats.currentPage} of {stats.pages}</span>
               <span className="border-l pl-4 border-gray-300">Words: {stats.words}</span>
               <span className="border-l pl-4 border-gray-300">Chars: {stats.chars}</span>
           </div>
           <div className="flex gap-4 items-center">
               <span>Urdu (Pakistan)</span>
               <div className="flex items-center gap-2">
                   <span>100%</span>
                   <button className="hover:bg-gray-200 rounded-full p-0.5"><i className="fas fa-minus text-xs"></i></button>
                   <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                       <div className="w-3/4 h-full bg-blue-500"></div>
                   </div>
                   <button className="hover:bg-gray-200 rounded-full p-0.5"><i className="fas fa-plus text-xs"></i></button>
               </div>
           </div>
       </div>
    </div>
  );
};

export default EditorPage;