import React, { useState, useEffect, useMemo } from 'react';
import { 
    MagnifyingGlassIcon, FunnelIcon, XMarkIcon, 
    BookOpenIcon, LockClosedIcon, ClockIcon, 
    CheckCircleIcon, ChevronDownIcon, Squares2X2Icon, ListBulletIcon,
    ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useNavigate, useLocation } from 'react-router-dom';
import { bookService } from '../../api/bookService';
import BookDetailsModal from './BookDetailsModal';
import RestrictedRequestManager from '../RestrictedAccess/RestrictedRequestManager';
import { useBookAccess } from '../../hooks/useBookAccess'; 
import useAuth from '../../hooks/useAuth'; 
import toast from 'react-hot-toast';

// --- ✨ Premium Skeleton Loader (Loading Effect) ---
const BookSkeleton = () => (
    <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="aspect-[2/3] bg-slate-200 rounded-2xl mb-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 animate-[shimmer_1.5s_infinite]"></div>
        </div>
        <div className="h-4 bg-slate-200 rounded w-3/4 mb-3"></div>
        <div className="h-3 bg-slate-200 rounded w-1/2 mb-4"></div>
        <div className="h-10 bg-slate-50 rounded-xl mt-auto border border-slate-100"></div>
    </div>
);

const UserLibrary = () => {
    // --- 🔐 Auth & Navigation ---
    const { isAuth } = useAuth(); 
    const navigate = useNavigate();
    const location = useLocation();

    // --- 📚 Data States ---
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [languages, setLanguages] = useState([]);

    // --- 🎣 Custom Hook for Access Status ---
    // Ye hook ab Token use karega status check karne ke liye
    const { accessStatuses, isChecking } = useBookAccess(books, isAuth);

    // --- 🎨 UI States ---
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedLanguage, setSelectedLanguage] = useState('All');
    const [sortBy, setSortBy] = useState('newest');
    const [viewMode, setViewMode] = useState('grid');
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // --- 🖼️ Modal States ---
    const [selectedBook, setSelectedBook] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [requestingBook, setRequestingBook] = useState(null);

    // --- 🚀 Initial Data Fetch ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Parallel fetching for speed
                const [booksData, catsData, langsData] = await Promise.all([
                    bookService.getAllBooks({ approved_only: true }), 
                    bookService.getAllSubcategories(),
                    bookService.getAllLanguages()
                ]);
                setBooks(booksData || []);
                setCategories(catsData || []);
                setLanguages(langsData || []);
            } catch (error) {
                console.error("Library error:", error);
                toast.error("Kitabein load nahi ho sakin.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // --- 🔍 Smart Filtering Logic ---
    const filteredBooks = useMemo(() => {
        let result = [...books];

        // Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(b => 
                b.title.toLowerCase().includes(q) || 
                b.author?.toLowerCase().includes(q)
            );
        }

        // Category Filter
        if (selectedCategory !== 'All') {
            result = result.filter(b => 
                b.category?.name === selectedCategory || 
                b.subcategories?.some(sub => sub.name === selectedCategory)
            );
        }

        // Language Filter
        if (selectedLanguage !== 'All') {
            result = result.filter(b => b.language?.name === selectedLanguage);
        }

        // Sorting
        if (sortBy === 'az') result.sort((a, b) => a.title.localeCompare(b.title));
        if (sortBy === 'za') result.sort((a, b) => b.title.localeCompare(a.title));
        if (sortBy === 'newest') result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return result;
    }, [books, searchQuery, selectedCategory, selectedLanguage, sortBy]);

    // --- 🔥 MAIN ACTION LOGIC (The Flipkart Flow) ---
    const handleBookClick = (book) => {
        const access = accessStatuses[book.id];

        // Case 1: Restricted Book
        if (book.is_restricted) {
            
            // A: Already Approved -> Read Book
            if (isAuth && access?.can_read) {
                setSelectedBook(book);
                setIsModalOpen(true);
            }
            
            // B: Pending Request -> Show Wait Message
            else if (isAuth && access?.status === 'pending') {
                toast("Aapki darkhwast zere-ghaur (Pending) hai.", {
                    icon: '⏳',
                    style: { borderRadius: '10px', background: '#fffbeb', color: '#92400e' },
                });
            }

            // C: Rejected -> Show Rejection Reason & Retry Option
            else if (isAuth && access?.status === 'rejected') {
                toast.error(`Request Rejected: ${access.rejection_reason || "Wajah nahi batayi gayi."}`);
                setRequestingBook(book); // Allow to request again
            }

            // D: New Request (Logged In) -> Open Form
            else if (isAuth) {
                setRequestingBook(book);
            }

            // E: Not Logged In -> Redirect to Login (Flipkart Style)
            else {
                toast.dismiss(); // Clear old toasts
                toast((t) => (
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                            <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-slate-800">Login Required</p>
                            <p className="text-xs text-slate-500">Darkhwast ke liye login karein.</p>
                        </div>
                    </div>
                ), { duration: 4000 });

                // Redirect user to login, and remember to bring them back here
                navigate('/login', { state: { from: location.pathname } });
            }
        } 
        
        // Case 2: Open Book (No Restriction)
        else {
            setSelectedBook(book);
            setIsModalOpen(true);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20 font-sans selection:bg-indigo-100 selection:text-indigo-700">
            
            {/* --- HEADER (Glassmorphism) --- */}
            <div className="bg-white/80 border-b border-slate-200 sticky top-0 z-30 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                        
                        {/* Search Bar */}
                        <div className="relative flex-1 max-w-2xl group transition-all">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by title, author, or ISBN..."
                                className="block w-full pl-11 pr-4 py-3 bg-slate-100/50 border border-transparent rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* View & Filter Controls */}
                        <div className="flex items-center gap-3">
                            <div className="hidden md:flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/50">
                                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}>
                                    <Squares2X2Icon className="h-5 w-5" />
                                </button>
                                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}>
                                    <ListBulletIcon className="h-5 w-5" />
                                </button>
                            </div>
                            
                            <button 
                                onClick={() => setShowMobileFilters(!showMobileFilters)}
                                className="lg:hidden p-3 bg-white border border-slate-200 text-slate-600 rounded-xl shadow-sm active:scale-95 transition-transform"
                            >
                                <FunnelIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8 flex gap-8">
                
                {/* --- SIDEBAR FILTERS (Sticky) --- */}
                <aside className={`lg:w-64 flex-shrink-0 space-y-8 ${showMobileFilters ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto animate-in slide-in-from-left duration-300' : 'hidden lg:block sticky top-24 h-fit'}`}>
                    {showMobileFilters && (
                        <div className="flex justify-between items-center mb-6 lg:hidden">
                            <h2 className="text-xl font-black text-slate-800">Filters</h2>
                            <button onClick={() => setShowMobileFilters(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><XMarkIcon className="h-6 w-6" /></button>
                        </div>
                    )}

                    {/* Categories */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Squares2X2Icon className="w-4 h-4" /> Categories
                        </h3>
                        <div className="space-y-1">
                            {['All', ...categories.map(c => c.name)].map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => {setSelectedCategory(cat); setShowMobileFilters(false)}}
                                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                        selectedCategory === cat 
                                        ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-500/10 translate-x-1' 
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Languages */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <ListBulletIcon className="w-4 h-4" /> Languages
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {['All', ...languages.map(l => l.name)].map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => setSelectedLanguage(lang)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 ${
                                        selectedLanguage === lang
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-md transform scale-105'
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-white'
                                    }`}
                                >
                                    {lang}
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* --- MAIN GRID AREA --- */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Library</h2>
                            <p className="text-sm text-slate-500 mt-1 font-medium">Discover {filteredBooks.length} books in our collection</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 hidden sm:inline">Sort by:</span>
                            <div className="relative group">
                                <select 
                                    className="appearance-none bg-white border border-slate-200 pl-4 pr-10 py-2 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm hover:border-slate-300 transition-colors"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="az">Title (A-Z)</option>
                                    <option value="za">Title (Z-A)</option>
                                </select>
                                <ChevronDownIcon className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                            {[...Array(8)].map((_, i) => <BookSkeleton key={i} />)}
                        </div>
                    ) : filteredBooks.length > 0 ? (
                        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                            {filteredBooks.map((book) => {
                                const access = accessStatuses[book.id];
                                const isRestricted = book.is_restricted;

                                return (
                                    <div 
                                        key={book.id}
                                        onClick={() => handleBookClick(book)}
                                        className={`group bg-white rounded-[1.5rem] border border-slate-100 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer overflow-hidden flex ${viewMode === 'list' ? 'flex-row items-center p-4 gap-6' : 'flex-col'}`}
                                    >
                                        {/* Cover Image */}
                                        <div className={`relative overflow-hidden bg-slate-100 ${viewMode === 'list' ? 'w-24 h-36 rounded-xl flex-shrink-0' : 'aspect-[2/3]'}`}>
                                            <img 
                                                src={book.cover_image_url || "https://via.placeholder.com/300x450?text=No+Cover"} 
                                                alt={book.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                loading="lazy"
                                            />
                                            
                                            {/* Status Badge (Smart Indicators) */}
                                            {isRestricted && (
                                                <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1">
                                                    {isAuth && access?.can_read ? (
                                                        <div className="bg-emerald-500 text-white p-1.5 rounded-full shadow-lg shadow-emerald-900/20 animate-in zoom-in duration-300">
                                                            <CheckCircleIcon className="w-4 h-4" />
                                                        </div>
                                                    ) : isAuth && access?.status === 'pending' ? (
                                                        <div className="bg-amber-400 text-white p-1.5 rounded-full shadow-lg shadow-amber-900/20 animate-in zoom-in duration-300">
                                                            <ClockIcon className="w-4 h-4" />
                                                        </div>
                                                    ) : isAuth && access?.status === 'rejected' ? (
                                                        <div className="bg-red-500 text-white p-1.5 rounded-full shadow-lg shadow-red-900/20 animate-in zoom-in duration-300">
                                                            <XMarkIcon className="w-4 h-4" />
                                                        </div>
                                                    ) : (
                                                        <div className="bg-white/90 backdrop-blur-sm text-slate-400 p-1.5 rounded-full shadow-lg">
                                                            <LockClosedIcon className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Content Area */}
                                        <div className={`flex-1 flex flex-col ${viewMode === 'list' ? '' : 'p-5'}`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider border border-indigo-100">
                                                    {book.language?.name || 'English'}
                                                </span>
                                            </div>
                                            
                                            <h3 className={`font-bold text-slate-800 leading-tight mb-1 group-hover:text-indigo-600 transition-colors ${viewMode === 'list' ? 'text-lg' : 'text-base line-clamp-2'}`}>
                                                {book.title}
                                            </h3>
                                            <p className="text-xs text-slate-400 mb-4 font-medium">{book.author || 'Unknown Author'}</p>

                                            {/* Dynamic Smart Buttons */}
                                            <div className="mt-auto pt-4 border-t border-slate-50">
                                                {isRestricted ? (
                                                    isAuth ? (
                                                        access?.can_read ? (
                                                            <button className="w-full py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black flex items-center justify-center gap-2 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                                                                <BookOpenIcon className="w-4 h-4" /> READ NOW
                                                            </button>
                                                        ) : access?.status === 'pending' ? (
                                                            <button className="w-full py-2.5 bg-amber-50 text-amber-700 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-wait border border-amber-100">
                                                                <ClockIcon className="w-4 h-4" /> REQUEST PENDING
                                                            </button>
                                                        ) : access?.status === 'rejected' ? (
                                                            <button className="w-full py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-black flex items-center justify-center gap-2 group-hover:bg-red-600 group-hover:text-white transition-all duration-300 border border-red-100">
                                                                <XMarkIcon className="w-4 h-4" /> REJECTED (RETRY)
                                                            </button>
                                                        ) : (
                                                            <button className="w-full py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black flex items-center justify-center gap-2 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                                                <LockClosedIcon className="w-4 h-4" /> REQUEST ACCESS
                                                            </button>
                                                        )
                                                    ) : (
                                                        // Not Logged In State
                                                        <button className="w-full py-2.5 bg-slate-50 text-slate-500 rounded-xl text-xs font-black flex items-center justify-center gap-2 group-hover:bg-slate-800 group-hover:text-white transition-all duration-300">
                                                            <LockClosedIcon className="w-4 h-4" /> LOGIN TO ACCESS
                                                        </button>
                                                    )
                                                ) : (
                                                    // Normal Book
                                                    <button className="w-full py-2.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-black flex items-center justify-center gap-2 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                                        View Details
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                            <div className="bg-slate-50 p-6 rounded-full mb-4">
                                <BookOpenIcon className="w-12 h-12 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">No books found</h3>
                            <p className="text-slate-400 mt-1 mb-6 text-sm">Try adjusting your filters or search query.</p>
                            <button 
                                onClick={() => {setSearchQuery(''); setSelectedCategory('All'); setSelectedLanguage('All')}} 
                                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* --- MODALS --- */}
            {/* Book Details Modal */}
            <BookDetailsModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                book={selectedBook} 
            />

            {/* Access Request Form (Only opens if user is logged in) */}
            {requestingBook && (
                <RestrictedRequestManager 
                    book={requestingBook} 
                    onClose={() => setRequestingBook(null)} 
                />
            )}
        </div>
    );
};

export default UserLibrary;