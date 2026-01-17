// src/components/book/BookForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { bookService } from '../../api/bookService'; 
import BookFormUI from './BookFormUI'; // Hum next step mein ye file banayenge

// --- Error Helper (Optimized) ---
const parseApiErrorToString = (error) => {
    if (!error) return 'An unknown error occurred.';
    if (error.message === 'Network Error') return 'Network Error: Server is unreachable.';
    
    // Handle Pydantic/FastAPI list errors
    if (Array.isArray(error.detail)) {
        return error.detail.map(e => {
            const field = e.loc ? e.loc[e.loc.length - 1] : 'Input';
            return `${field}: ${e.msg}`;
        }).join(', ');
    }
    
    // Handle Dictionary errors
    if (typeof error.detail === 'object') {
        const keys = Object.keys(error.detail);
        if (keys.length > 0) return `${keys[0]}: ${error.detail[keys[0]]}`;
    }

    return typeof error.detail === 'string' ? error.detail : error.message;
};

const BookForm = ({ onBookAdded, onBookUpdated, initialData = null, isEditing = false }) => {

    // 1. Initial State Setup
    const getInitialState = useCallback(() => ({
        title: initialData?.title || '',
        author: initialData?.author || '',
        publisher: initialData?.publisher || '',
        translator: initialData?.translator || '',
        publication_year: initialData?.publication_year || '',
        edition: initialData?.edition || '',
        isbn: initialData?.isbn || '',
        pages: initialData?.pages || '',
        parts_or_volumes: initialData?.parts_or_volumes || '',
        language_id: initialData?.language?.id || '',
        subcategory_ids: initialData?.subcategories?.map(sub => sub.id) || [],
        serial_number: initialData?.serial_number || '',
        book_number: initialData?.book_number || '',
        subject_number: initialData?.subject_number || '',
        price: initialData?.price || '',
        date_of_purchase: initialData?.date_of_purchase ? initialData.date_of_purchase.split('T')[0] : '',
        remarks: initialData?.remarks || '',
        description: initialData?.description || '',
        is_digital: initialData?.is_digital || false,
        is_restricted: initialData?.is_restricted || false,
    }), [initialData]);

    // 2. States
    const [formData, setFormData] = useState(getInitialState());
    const [coverImageFile, setCoverImageFile] = useState(null);
    const [pdfFile, setPdfFile] = useState(null);
    
    // Data Lists
    const [languages, setLanguages] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    
    // Status States
    const [isLoading, setIsLoading] = useState(false);
    const [isDropdownLoading, setIsDropdownLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // 3. Fetch Dropdown Data
    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            setIsDropdownLoading(true);
            try {
                const [langData, subcatData] = await Promise.all([
                    bookService.getAllLanguages(),
                    bookService.getAllSubcategories(),
                ]);
                if (isMounted) {
                    setLanguages(langData || []);
                    setSubcategories(subcatData || []);
                }
            } catch (err) {
                if (isMounted) setError(parseApiErrorToString(err));
            } finally {
                if (isMounted) setIsDropdownLoading(false);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, []);

    // 4. Reset Form on InitialData Change
    useEffect(() => { 
        setFormData(getInitialState()); 
        setCoverImageFile(null);
        setPdfFile(null);
        setError(null);
        setSuccessMessage(null);
    }, [initialData, getInitialState]);

    // 5. Handlers
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubcategoryChange = (e) => {
        const selectedIds = Array.from(e.target.selectedOptions, option => Number(option.value));
        setFormData(prev => ({ ...prev, subcategory_ids: selectedIds }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        const file = files.length > 0 ? files[0] : null;
        if (name === 'coverImageFile') setCoverImageFile(file);
        else if (name === 'pdfFile') setPdfFile(file);
    };

    // 6. Submit Logic (Clean & Optimized)
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.title.trim()) { setError('Title is required.'); return; }
        if (!formData.language_id) { setError('Language is required.'); return; }

        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        const dataToSubmit = new FormData();

        // Smart Data Append
        Object.keys(formData).forEach(key => {
            if (['subcategory_ids', 'cover_image_url', 'pdf_url'].includes(key)) return;
            
            let value = formData[key];
            // Handle Optional Fields - Send 'null' to backend if empty
            if (value === '' && ![ 'title', 'language_id' ].includes(key)) {
               // Skip appending empty strings so backend uses default or null
               return; 
            }
            dataToSubmit.append(key, value);
        });

        // Arrays & Files
        formData.subcategory_ids.forEach(id => dataToSubmit.append('subcategory_ids', id));
        if (coverImageFile) dataToSubmit.append('cover_image', coverImageFile);
        if (pdfFile) dataToSubmit.append('pdf_file', pdfFile);

        try {
            let resultBook;
            if (isEditing) {
                resultBook = await bookService.updateBook(initialData.id, dataToSubmit);
                setSuccessMessage('Book updated successfully!');
                if (onBookUpdated) onBookUpdated(resultBook);
            } else {
                resultBook = await bookService.createBook(dataToSubmit);
                // Try creating approval request silently
                try { await bookService.createApprovalRequest(resultBook.id); } catch (e) { console.warn("Auto-approval req failed", e); }
                
                setSuccessMessage('Book added successfully!');
                if (onBookAdded) onBookAdded(resultBook);
                
                // Full Reset
                setFormData(getInitialState());
                setCoverImageFile(null);
                setPdfFile(null);
                // Reset file inputs manually via DOM id is handled in UI component via key or ref
            }
        } catch (err) {
            console.error("Submit Error:", err);
            setError(parseApiErrorToString(err));
        } finally {
            setIsLoading(false);
        }
    };

    // 7. Render Presentation Component
    return (
        <BookFormUI 
            // Data
            formData={formData}
            languages={languages}
            subcategories={subcategories}
            initialData={initialData}
            isEditing={isEditing}
            
            // Status
            isLoading={isLoading}
            isDropdownLoading={isDropdownLoading}
            error={error}
            successMessage={successMessage}
            
            // Files (For UI feedback)
            coverImageName={coverImageFile?.name}
            pdfFileName={pdfFile?.name}

            // Handlers
            onChange={handleChange}
            onSubcategoryChange={handleSubcategoryChange}
            onFileChange={handleFileChange}
            onSubmit={handleSubmit}
        />
    );
};

export default BookForm;