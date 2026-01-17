// src/hooks/useBookSearch.js
import { useState, useMemo, useEffect } from 'react';

export const useBookSearch = (initialBooks = []) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLanguage, setSelectedLanguage] = useState("all");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [debouncedTerm, setDebouncedTerm] = useState("");

    // 1. Debouncing Logic: Taaki har keypress par UI hang na ho
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedTerm(searchTerm);
        }, 300); // 300ms delay
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const filteredBooks = useMemo(() => {
        return initialBooks.filter((book) => {
            // Language Filter
            const matchesLanguage = selectedLanguage === "all" || 
                book.language?.name.toLowerCase() === selectedLanguage.toLowerCase();

            // Category Filter
            const matchesCategory = selectedCategory === "all" || 
                book.subcategories?.some(sub => sub.name.toLowerCase() === selectedCategory.toLowerCase());

            // Search Term Logic (Smart Search)
            const cleanTerm = debouncedTerm.toLowerCase().trim();
            const matchesSearch = !cleanTerm || 
                book.title.toLowerCase().includes(cleanTerm) ||
                book.author?.toLowerCase().includes(cleanTerm) ||
                book.isbn?.includes(cleanTerm);

            return matchesLanguage && matchesCategory && matchesSearch;
        });
    }, [initialBooks, debouncedTerm, selectedLanguage, selectedCategory]);

    return {
        searchTerm,
        setSearchTerm,
        selectedLanguage,
        setSelectedLanguage,
        selectedCategory,
        setSelectedCategory,
        filteredBooks
    };
};