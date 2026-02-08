import React from 'react';

const SkeletonLoader = ({ type = "text", count = 1 }) => {
    // Helper to repeat skeletons
    const skeletons = Array(count).fill(0);

    return (
        <div className="space-y-3 animate-pulse">
            {skeletons.map((_, index) => {
                if (type === "card") {
                    return (
                        <div key={index} className="p-4 border border-slate-700 rounded-xl bg-slate-800/50">
                            <div className="flex gap-4">
                                <div className="w-12 h-16 bg-slate-700 rounded"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                                    <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                                </div>
                            </div>
                        </div>
                    );
                }
                // Default: Simple Text Line
                return (
                    <div key={index} className="h-10 bg-slate-800 rounded-lg w-full"></div>
                );
            })}
        </div>
    );
};

export default SkeletonLoader;