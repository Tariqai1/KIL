import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
    CloudArrowUpIcon, 
    PhotoIcon, 
    DevicePhoneMobileIcon, 
    ComputerDesktopIcon,
    QrCodeIcon,
    BuildingLibraryIcon,
    DocumentTextIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';
import { donationService } from '../../api/donationService';

// ✅ Config: API Base URL
const API_BASE_URL = "http://127.0.0.1:8000";

const DonationManager = () => {
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    
    // Server Data
    const [serverData, setServerData] = useState(null);

    // Selected Files
    const [files, setFiles] = useState({
        qr_code_desktop: null, qr_code_mobile: null,
        appeal_desktop: null, appeal_mobile: null,
        bank_desktop: null, bank_mobile: null
    });

    // Previews
    const [previews, setPreviews] = useState({});

    // --- 1. Fetch Existing Data ---
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await donationService.getDonationDetails();
            setServerData(data);
        } catch (error) {
            toast.error("Failed to load donation details");
        } finally {
            setLoading(false);
        }
    };

    // --- 2. Handle File Selection ---
    const handleFileChange = (e, key) => {
        const file = e.target.files[0];
        if (file) {
            setFiles(prev => ({ ...prev, [key]: file }));
            setPreviews(prev => ({ ...prev, [key]: URL.createObjectURL(file) }));
        }
    };

    // --- 3. Save / Upload ---
    const handleSave = async () => {
        setUploading(true);
        const formData = new FormData();

        Object.keys(files).forEach(key => {
            if (files[key]) formData.append(key, files[key]);
        });

        try {
            await donationService.updateDonationDetails(formData);
            toast.success("Donation details updated successfully!");
            
            // Reset local files
            setFiles({
                qr_code_desktop: null, qr_code_mobile: null,
                appeal_desktop: null, appeal_mobile: null,
                bank_desktop: null, bank_mobile: null
            });
            setPreviews({});
            fetchData();
            
        } catch (error) {
            console.error(error);
            toast.error("Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    // Helper to resolve Image URL
    const getDisplayImage = (key, serverKey) => {
        if (previews[key]) return previews[key];
        const serverPath = serverData?.[serverKey];
        if (serverPath) {
            return serverPath.startsWith('http') ? serverPath : `${API_BASE_URL}${serverPath}`;
        }
        return null;
    };

    if (loading) return <div className="p-10 text-center animate-pulse">Loading settings...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto pb-20">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#002147]">Donation Settings</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage Responsive Images for Desktop & Mobile users</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={uploading}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold shadow-lg transition-all transform active:scale-95 ${
                        uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#002147] hover:bg-[#003366] hover:shadow-xl'
                    }`}
                >
                    {uploading ? 'Uploading...' : <><CloudArrowUpIcon className="w-5 h-5" /> Save Changes</>}
                </button>
            </div>

            {/* --- SECTIONS --- */}
            <div className="space-y-10">
                
                {/* 1. QR CODE SECTION (Square usually) */}
                <DualUploadSection 
                    title="QR Code" 
                    icon={<QrCodeIcon className="w-6 h-6" />}
                    desc="Upload the payment QR code clearly."
                    
                    // Desktop
                    desktopImg={getDisplayImage('qr_code_desktop', 'qr_code_desktop')}
                    onDesktopChange={(e) => handleFileChange(e, 'qr_code_desktop')}
                    desktopHint="Square (1:1) - e.g. 500x500px"
                    
                    // Mobile
                    mobileImg={getDisplayImage('qr_code_mobile', 'qr_code_mobile')}
                    onMobileChange={(e) => handleFileChange(e, 'qr_code_mobile')}
                    mobileHint="Square (1:1) - e.g. 500x500px"
                />

                {/* 2. BANK DETAILS SECTION */}
                <DualUploadSection 
                    title="Bank Details" 
                    icon={<BuildingLibraryIcon className="w-6 h-6" />}
                    desc="Image containing Account No, IFSC, Branch Name etc."
                    
                    // Desktop (Landscape)
                    desktopImg={getDisplayImage('bank_desktop', 'bank_desktop')}
                    onDesktopChange={(e) => handleFileChange(e, 'bank_desktop')}
                    desktopHint="Landscape (16:9) - e.g. 1200x675px"
                    
                    // Mobile (Portrait)
                    mobileImg={getDisplayImage('bank_mobile', 'bank_mobile')}
                    onMobileChange={(e) => handleFileChange(e, 'bank_mobile')}
                    mobileHint="Portrait (9:16) - e.g. 1080x1920px"
                />

                {/* 3. APPEAL SECTION */}
                <DualUploadSection 
                    title="Appeal / Request" 
                    icon={<DocumentTextIcon className="w-6 h-6" />}
                    desc="The detailed appeal letter or poster asking for support."
                    
                    // Desktop (Landscape)
                    desktopImg={getDisplayImage('appeal_desktop', 'appeal_desktop')}
                    onDesktopChange={(e) => handleFileChange(e, 'appeal_desktop')}
                    desktopHint="Landscape (16:9) - e.g. 1200x800px"
                    
                    // Mobile (Portrait)
                    mobileImg={getDisplayImage('appeal_mobile', 'appeal_mobile')}
                    onMobileChange={(e) => handleFileChange(e, 'appeal_mobile')}
                    mobileHint="Portrait (9:16) - e.g. 1080x1920px"
                />

            </div>
        </div>
    );
};

// --- IMPROVED REUSABLE COMPONENT ---
const DualUploadSection = ({ 
    title, icon, desc, 
    desktopImg, onDesktopChange, desktopHint,
    mobileImg, onMobileChange, mobileHint
}) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
        
        {/* Section Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3 font-bold text-slate-800 text-lg">
                <div className="p-2 bg-white rounded-lg shadow-sm text-[#002147]">{icon}</div>
                {title}
            </div>
            <p className="text-slate-500 text-sm mt-1 ml-12">{desc}</p>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
            
            {/* Desktop Column */}
            <div className="flex flex-col">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#002147]">
                        <ComputerDesktopIcon className="w-5 h-5" /> Desktop View
                    </div>
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-bold border border-blue-100">
                        Wide Image
                    </span>
                </div>

                {/* Upload Box */}
                <div className="relative group w-full aspect-video bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#002147] hover:bg-blue-50/50 transition-all flex items-center justify-center overflow-hidden cursor-pointer">
                    {desktopImg ? (
                        <>
                            <img src={desktopImg} alt="Desktop" className="w-full h-full object-contain p-2" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white font-bold text-sm bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">Change Image</span>
                            </div>
                        </>
                    ) : (
                        <div className="text-slate-400 text-center p-4">
                            <PhotoIcon className="w-12 h-12 mx-auto mb-2 opacity-50 group-hover:scale-110 transition-transform"/> 
                            <span className="text-xs font-semibold">Click to Upload Desktop Image</span>
                        </div>
                    )}
                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" onChange={onDesktopChange} />
                </div>
                
                {/* Size Hint */}
                <div className="mt-3 flex items-start gap-1.5 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <InformationCircleIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span>Recommended Size: <strong className="text-slate-700">{desktopHint}</strong></span>
                </div>
            </div>

            {/* Mobile Column */}
            <div className="flex flex-col">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-rose-600">
                        <DevicePhoneMobileIcon className="w-5 h-5" /> Mobile View
                    </div>
                    <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-1 rounded-full font-bold border border-rose-100">
                        Tall Image
                    </span>
                </div>

                {/* Upload Box (Simulating Phone Aspect Ratio) */}
                <div className="relative group w-2/3 mx-auto aspect-[9/16] bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 hover:border-rose-500 hover:bg-rose-50/50 transition-all flex items-center justify-center overflow-hidden cursor-pointer shadow-inner">
                    {mobileImg ? (
                        <>
                            <img src={mobileImg} alt="Mobile" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white font-bold text-sm bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">Change</span>
                            </div>
                        </>
                    ) : (
                        <div className="text-slate-400 text-center p-4">
                            <PhotoIcon className="w-10 h-10 mx-auto mb-2 opacity-50 group-hover:scale-110 transition-transform"/> 
                            <span className="text-xs font-semibold">Upload Mobile Image</span>
                        </div>
                    )}
                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" onChange={onMobileChange} />
                </div>

                {/* Size Hint */}
                <div className="mt-3 flex items-start gap-1.5 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 w-2/3 mx-auto">
                    <InformationCircleIcon className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span>Recommended: <strong className="text-slate-700">{mobileHint}</strong></span>
                </div>
            </div>

        </div>
    </div>
);

export default DonationManager;