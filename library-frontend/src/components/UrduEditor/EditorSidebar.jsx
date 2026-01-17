// src/components/UrduEditor/EditorSidebar.jsx
import React, { useState } from 'react';

const EditorSidebar = ({ 
  chapters, 
  activeChapterId, 
  onSelectChapter, 
  onAddChapter, 
  onDeleteChapter, 
  bookTitle, 
  onTitleChange 
}) => {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  const filteredChapters = chapters.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const startEditing = (e, chapter) => {
    e.stopPropagation();
    setEditingId(chapter.id);
    setEditTitle(chapter.title);
  };

  const saveTitle = () => {
    // In a real app, call a prop function here to save the new title
    setEditingId(null);
  };

  return (
    <aside className="w-60 bg-white border-l border-gray-200 h-full flex flex-col z-20 flex-shrink-0 select-none">
      
      {/* --- Header (Project Name & Search) --- */}
      <div className="p-3 border-b border-gray-200 bg-[#f8f9fa]">
         <div className="mb-2">
            <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Project</label>
            <input 
                value={bookTitle} 
                onChange={(e) => onTitleChange(e.target.value)}
                className="w-full text-sm font-bold text-gray-800 bg-transparent outline-none truncate hover:text-blue-600 transition border-b border-transparent hover:border-gray-300 pb-0.5"
                placeholder="Untitled Document"
            />
         </div>

         <div className="relative">
            <i className="fas fa-search absolute right-2 top-2 text-gray-400 text-xs"></i>
            <input 
                type="text"
                placeholder="تلاش (Search)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                dir="rtl"
                className="w-full bg-white text-right pr-7 pl-2 py-1.5 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none text-xs placeholder-gray-400"
            />
         </div>
      </div>

      {/* --- Chapter List (MS Word Navigation Style) --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
         {filteredChapters.map(chapter => (
             <div 
                key={chapter.id}
                onClick={() => onSelectChapter(chapter.id)}
                className={`group flex items-center justify-between py-2 px-3 cursor-pointer border-l-[3px] transition-all ${
                    activeChapterId === chapter.id 
                    ? 'bg-[#e1dfdd] border-blue-600 text-black' // Word-like Active State
                    : 'bg-white border-transparent text-gray-600 hover:bg-[#f3f2f1]' // Word-like Hover
                }`}
             >
                <div className="flex-1 min-w-0 pr-1 text-right">
                    {editingId === chapter.id ? (
                        <input 
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={saveTitle}
                            autoFocus
                            className="w-full text-sm border border-blue-400 px-1"
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span className={`block truncate text-sm leading-relaxed ${activeChapterId === chapter.id ? 'font-bold' : 'font-medium'}`} style={{fontFamily: 'Noto Nastaliq Urdu'}}>
                            {chapter.title}
                        </span>
                    )}
                </div>

                {/* Hover Actions */}
                <div className={`flex gap-1 ${activeChapterId === chapter.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <button onClick={(e) => startEditing(e, chapter)} className="text-gray-400 hover:text-blue-600">
                        <i className="fas fa-pen text-[10px]"></i>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteChapter(chapter.id); }} className="text-gray-400 hover:text-red-600">
                        <i className="fas fa-times text-[10px]"></i>
                    </button>
                </div>
             </div>
         ))}
      </div>

      {/* --- Footer (Add Button) --- */}
      <div className="p-2 border-t border-gray-200 bg-[#f8f9fa]">
          <button 
            onClick={onAddChapter}
            className="w-full flex items-center justify-center gap-2 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 text-xs font-bold shadow-sm transition-colors"
          >
            <i className="fas fa-plus"></i> نیا باب (New)
          </button>
      </div>
    </aside>
  );
};

export default EditorSidebar;