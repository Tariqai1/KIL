import React, { useState, useEffect } from 'react';
import { 
    XMarkIcon, 
    QrCodeIcon, 
    BuildingLibraryIcon, 
    DocumentTextIcon,
    DevicePhoneMobileIcon,
    ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import { donationService } from '../../api/donationService';

// ✅ Config: API Base URL
const API_BASE_URL = "http://127.0.0.1:8000"; 

const DonationModal = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('qr'); // 'qr', 'bank', 'appeal'
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    const fetchData = async () => {
        try {
            const result = await donationService.getDonationDetails();
            setData(result);
        } catch (error) {
            console.error("Failed to load donation info");
        } finally {
            setLoading(false);
        }
    };

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${API_BASE_URL}${path}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            
            {/* Modal Box */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg md:max-w-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200 max-h-[90vh]">
                
                {/* --- Header --- */}
                <div className="bg-[#001D3D] p-4 md:p-5 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-serif font-bold text-white tracking-wide">
                            Support Us
                        </h2>
                        <p className="text-xs text-[#F4A261] uppercase tracking-wider font-bold mt-1">
                            Your Contribution Matters
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* --- Tabs (Navigation) --- */}
                <div className="flex p-2 bg-gray-50 border-b border-gray-100 gap-2 shrink-0">
                    <TabButton 
                        active={activeTab === 'qr'} 
                        onClick={() => setActiveTab('qr')} 
                        icon={<QrCodeIcon className="w-5 h-5" />}
                        label="Scan QR" 
                    />
                    <TabButton 
                        active={activeTab === 'bank'} 
                        onClick={() => setActiveTab('bank')} 
                        icon={<BuildingLibraryIcon className="w-5 h-5" />}
                        label="Bank Details" 
                    />
                    <TabButton 
                        active={activeTab === 'appeal'} 
                        onClick={() => setActiveTab('appeal')} 
                        icon={<DocumentTextIcon className="w-5 h-5" />}
                        label="Appeal" 
                    />
                </div>

                {/* --- Content Area (Responsive Logic) --- */}
                <div className="p-0 flex-1 overflow-y-auto bg-gray-100/50 flex flex-col items-center justify-start min-h-[300px] relative">
                    
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 mt-10">
                            <div className="w-12 h-12 border-4 border-gray-200 border-t-[#2D89C8] rounded-full animate-spin mb-4"></div>
                            <p className="text-sm font-medium">Loading details...</p>
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-300">
                            
                            {/* ==========================
                                1. QR CODE VIEW 
                               ========================== */}
                            {activeTab === 'qr' && (
                                <div className="w-full h-full flex flex-col items-center justify-center p-4">
                                    {/* 📱 MOBILE VIEW (Visible only on small screens) */}
                                    <div className="block md:hidden w-full">
                                        {data?.qr_code_mobile ? (
                                            <img 
                                                src={getImageUrl(data.qr_code_mobile)} 
                                                alt="QR Mobile" 
                                                className="w-full h-auto rounded-lg shadow-md border border-gray-200"
                                            />
                                        ) : (
                                            <NoImagePlaceholder type="Mobile" />
                                        )}
                                        <p className="text-xs text-center text-gray-400 mt-2 flex items-center justify-center gap-1"><DevicePhoneMobileIcon className="w-3 h-3"/> Mobile View</p>
                                    </div>

                                    {/* 💻 DESKTOP VIEW (Visible only on medium/large screens) */}
                                    <div className="hidden md:block w-full text-center">
                                        {data?.qr_code_desktop ? (
                                            <img 
                                                src={getImageUrl(data.qr_code_desktop)} 
                                                alt="QR Desktop" 
                                                className="max-w-[80%] max-h-[60vh] mx-auto rounded-lg shadow-md border border-gray-200"
                                            />
                                        ) : (
                                            <NoImagePlaceholder type="Desktop" />
                                        )}
                                         <p className="text-xs text-center text-gray-400 mt-2 flex items-center justify-center gap-1"><ComputerDesktopIcon className="w-3 h-3"/> Desktop View</p>
                                    </div>
                                </div>
                            )}

                            {/* ==========================
                                2. BANK DETAILS VIEW 
                               ========================== */}
                            {activeTab === 'bank' && (
                                <div className="w-full h-full flex flex-col items-center justify-center p-4">
                                    {/* 📱 MOBILE */}
                                    <div className="block md:hidden w-full">
                                        {data?.bank_mobile ? (
                                            <img 
                                                src={getImageUrl(data.bank_mobile)} 
                                                alt="Bank Mobile" 
                                                className="w-full h-auto rounded-lg shadow-md"
                                            />
                                        ) : (
                                            <NoImagePlaceholder type="Mobile" />
                                        )}
                                    </div>

                                    {/* 💻 DESKTOP */}
                                    <div className="hidden md:block w-full text-center">
                                        {data?.bank_desktop ? (
                                            <img 
                                                src={getImageUrl(data.bank_desktop)} 
                                                alt="Bank Desktop" 
                                                className="max-w-full max-h-[60vh] mx-auto rounded-lg shadow-md"
                                            />
                                        ) : (
                                            <NoImagePlaceholder type="Desktop" />
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ==========================
                                3. APPEAL VIEW 
                               ========================== */}
                            {activeTab === 'appeal' && (
                                <div className="w-full h-full flex flex-col items-center justify-center p-4">
                                    {/* 📱 MOBILE */}
                                    <div className="block md:hidden w-full">
                                        {data?.appeal_mobile ? (
                                            <img 
                                                src={getImageUrl(data.appeal_mobile)} 
                                                alt="Appeal Mobile" 
                                                className="w-full h-auto rounded-lg shadow-md"
                                            />
                                        ) : (
                                            <NoImagePlaceholder type="Mobile" />
                                        )}
                                    </div>

                                    {/* 💻 DESKTOP */}
                                    <div className="hidden md:block w-full text-center">
                                        {data?.appeal_desktop ? (
                                            <img 
                                                src={getImageUrl(data.appeal_desktop)} 
                                                alt="Appeal Desktop" 
                                                className="max-w-full max-h-[60vh] mx-auto rounded-lg shadow-md"
                                            />
                                        ) : (
                                            <NoImagePlaceholder type="Desktop" />
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </div>

                {/* --- Footer --- */}
                <div className="bg-white p-3 text-center border-t border-gray-100 shrink-0">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                        JazakAllah Khair for your support
                    </p>
                </div>

            </div>
        </div>
    );
};

// --- Sub Components ---

const TabButton = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all duration-200 border ${
            active 
                ? "bg-[#001D3D] text-white border-[#001D3D] shadow-md transform scale-[1.02]" 
                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700"
        }`}
    >
        {icon}
        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden">{label.split(" ")[0]}</span>
    </button>
);

const NoImagePlaceholder = ({ type }) => (
    <div className="w-full py-20 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400">
        <p className="font-bold">No {type} Image Found</p>
        <p className="text-xs">Please upload from Admin Panel</p>
    </div>
);

export default DonationModal; 