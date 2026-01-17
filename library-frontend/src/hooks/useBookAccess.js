import { useState, useEffect } from 'react';
import axios from 'axios';

export const useBookAccess = (books, isAuth) => {
    const [accessStatuses, setAccessStatuses] = useState({});
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        // Agar user Login nahi hai, ya books load nahi huin, to check karne ka faida nahi
        if (!books || books.length === 0 || !isAuth) {
            setAccessStatuses({}); // Reset statuses
            return;
        }

        const fetchAllStatuses = async () => {
            setIsChecking(true);
            const statusMap = {};
            
            // Token LocalStorage se uthayenge
            const token = localStorage.getItem('token'); 

            try {
                // Sirf restricted books ko filter karein
                const restrictedBooks = books.filter(b => b.is_restricted);

                // Parallel Requests (Fast Speed)
                await Promise.all(
                    restrictedBooks.map(async (book) => {
                        try {
                            // 🔑 API Call with Token
                            const res = await axios.get(
                                `http://127.0.0.1:8000/api/restricted-requests/check-status?book_id=${book.id}`,
                                {
                                    headers: {
                                        Authorization: `Bearer ${token}` // Token bhej rahe hain
                                    }
                                }
                            );
                            
                            // Backend se jo data aaya use save karein
                            statusMap[book.id] = res.data; 
                            // Expected: { status: "approved", can_read: true, rejection_reason: null }

                        } catch (err) {
                            console.error(`Status check failed for book ${book.id}`, err);
                            // Agar error aaye (e.g. 401), to maan lein ke request nahi hui
                            statusMap[book.id] = { status: 'not_requested', can_read: false };
                        }
                    })
                );

                setAccessStatuses(statusMap);
            } catch (error) {
                console.error("Access check process failed", error);
            } finally {
                setIsChecking(false);
            }
        };

        fetchAllStatuses();
    }, [books, isAuth]); // Jab bhi Books ya Login status badle, dobara check karo

    return { accessStatuses, isChecking };
};