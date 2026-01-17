// src/components/book/BookFormUI.jsx
import React from 'react';
import { 
    PlusIcon, 
    ArrowPathIcon, 
    PaperClipIcon, 
    XCircleIcon, 
    CheckCircleIcon, 
    ExclamationCircleIcon 
} from '@heroicons/react/20/solid';

// --- STYLES & HELPERS ---
const INPUT_BASE_CLASS = "block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200 transition-all duration-200";
const LABEL_CLASS = "block text-sm font-medium leading-6 text-gray-900 mb-1";

// --- Reusable Input Component ---
const InputField = ({ label, id, type = "text", colSpan = "col-span-1", error, ...props }) => (
    <div className={`sm:${colSpan}`}>
        <label htmlFor={id} className={LABEL_CLASS}>{label}</label>
        <div className="relative rounded-md shadow-sm">
            <input
                id={id}
                type={type}
                className={`${INPUT_BASE_CLASS} ${error ? 'ring-red-300 focus:ring-red-500' : ''}`}
                {...props}
            />
        </div>
    </div>
);

// --- Reusable Text Area ---
const TextAreaField = ({ label, id, colSpan = "col-span-full", ...props }) => (
    <div className={`sm:${colSpan}`}>
        <label htmlFor={id} className={LABEL_CLASS}>{label}</label>
        <textarea
            id={id}
            rows={3}
            className={INPUT_BASE_CLASS}
            {...props}
        />
    </div>
);

// --- Reusable Select ---
const SelectField = ({ label, id, options, colSpan = "col-span-1", loading, placeholder = "Select...", ...props }) => (
    <div className={`sm:${colSpan}`}>
        <label htmlFor={id} className={LABEL_CLASS}>{label}</label>
        <select
            id={id}
            className={INPUT_BASE_CLASS}
            disabled={loading}
            {...props}
        >
            {loading ? <option>Loading...</option> : <option value="">{placeholder}</option>}
            {options.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
            ))}
        </select>
    </div>
);

// --- File Input Helper ---
const FileInput = ({ label, id, accept, onChange, currentUrl, newFileName, apiBaseUrl }) => (
    <div className="sm:col-span-3">
        <label htmlFor={id} className={LABEL_CLASS}>{label}</label>
        <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-6 hover:bg-gray-50 transition-colors bg-white">
            <div className="text-center">
                <PaperClipIcon className="mx-auto h-8 w-8 text-gray-300" aria-hidden="true" />
                <div className="mt-2 flex text-sm leading-6 text-gray-600 justify-center">
                    <label
                        htmlFor={id}
                        className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                    >
                        <span>Upload a file</span>
                        <input id={id} name={id} type="file" accept={accept} className="sr-only" onChange={onChange} />
                    </label>
                </div>
                <p className="text-xs leading-5 text-gray-600">
                    {newFileName ? (
                        <span className="font-semibold text-green-600">Selected: {newFileName}</span>
                    ) : (
                        "Drag and drop or click to upload"
                    )}
                </p>
                {/* Show Current File Link if editing */}
                {currentUrl && !newFileName && (
                    <div className="mt-2 text-xs text-blue-500 bg-blue-50 py-1 px-2 rounded inline-block">
                        <a href={`${apiBaseUrl}${currentUrl}`} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                            <ArrowPathIcon className="w-3 h-3" /> View Current File
                        </a>
                    </div>
                )}
            </div>
        </div>
    </div>
);

// ==========================================
//           MAIN UI COMPONENT
// ==========================================
const BookFormUI = ({ 
    formData, 
    languages, 
    subcategories, 
    initialData, 
    isEditing, 
    isLoading, 
    isDropdownLoading, 
    error, 
    successMessage, 
    coverImageName, 
    pdfFileName, 
    onChange, 
    onSubcategoryChange, 
    onFileChange, 
    onSubmit 
}) => {
    
    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

    return (
        <form onSubmit={onSubmit} className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
            
            {/* --- Header & Status Messages --- */}
            <div className="px-4 py-6 sm:p-8">
                {error && (
                    <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200 animate-pulse">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Submission Error</h3>
                                <div className="mt-2 text-sm text-red-700"><p>{error}</p></div>
                            </div>
                        </div>
                    </div>
                )}
                {successMessage && (
                    <div className="mb-6 rounded-md bg-green-50 p-4 border border-green-200">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-green-800">{successMessage}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- Form Grid --- */}
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                    
                    {/* SECTION 1: Essential Info */}
                    <div className="sm:col-span-full border-b border-gray-900/10 pb-4 mb-2">
                        <h2 className="text-base font-semibold leading-7 text-gray-900">📖 Core Information</h2>
                        <p className="mt-1 text-sm leading-6 text-gray-600">Basic details about the book.</p>
                    </div>

                    <InputField id="title" name="title" label="Book Title *" colSpan="col-span-3" value={formData.title} onChange={onChange} required placeholder="e.g. The Alchemist" disabled={isLoading} />
                    <SelectField id="language_id" name="language_id" label="Language *" colSpan="col-span-3" options={languages} value={formData.language_id} onChange={onChange} loading={isDropdownLoading} required disabled={isLoading} />

                    <InputField id="author" name="author" label="Author / Compiler" colSpan="col-span-3" value={formData.author} onChange={onChange} disabled={isLoading} />
                    <InputField id="publisher" name="publisher" label="Publisher" colSpan="col-span-3" value={formData.publisher} onChange={onChange} disabled={isLoading} />
                    
                    <InputField id="translator" name="translator" label="Translator / Editor" colSpan="col-span-3" value={formData.translator} onChange={onChange} disabled={isLoading} />
                    <InputField id="edition" name="edition" label="Edition" colSpan="col-span-3" value={formData.edition} onChange={onChange} placeholder="e.g. 2nd Rev" disabled={isLoading} />

                    {/* SECTION 2: Identification & Printing */}
                    <div className="sm:col-span-full border-b border-gray-900/10 pb-4 mb-2 mt-4">
                        <h2 className="text-base font-semibold leading-7 text-gray-900">🆔 Identification & Specs</h2>
                    </div>

                    <InputField id="isbn" name="isbn" label="ISBN" colSpan="col-span-2" value={formData.isbn} onChange={onChange} disabled={isLoading} />
                    <InputField id="publication_year" name="publication_year" label="Year" type="number" colSpan="col-span-2" value={formData.publication_year} onChange={onChange} min="1000" disabled={isLoading} />
                    <InputField id="pages" name="pages" label="Pages" type="number" colSpan="col-span-2" value={formData.pages} onChange={onChange} min="1" disabled={isLoading} />
                    
                    <InputField id="parts_or_volumes" name="parts_or_volumes" label="Volume / Part" colSpan="col-span-2" value={formData.parts_or_volumes} onChange={onChange} disabled={isLoading} />
                    <InputField id="price" name="price" label="Price" type="number" step="0.01" colSpan="col-span-2" value={formData.price} onChange={onChange} disabled={isLoading} />
                    <InputField id="date_of_purchase" name="date_of_purchase" label="Purchase Date" type="date" colSpan="col-span-2" value={formData.date_of_purchase} onChange={onChange} disabled={isLoading} />

                    {/* SECTION 3: Library Codes */}
                    <div className="sm:col-span-full border-b border-gray-900/10 pb-4 mb-2 mt-4">
                        <h2 className="text-base font-semibold leading-7 text-gray-900">🏛️ Library Coding</h2>
                    </div>

                    <InputField id="serial_number" name="serial_number" label="Serial No." colSpan="col-span-2" value={formData.serial_number} onChange={onChange} disabled={isLoading} />
                    <InputField id="book_number" name="book_number" label="Book No." colSpan="col-span-2" value={formData.book_number} onChange={onChange} disabled={isLoading} />
                    <InputField id="subject_number" name="subject_number" label="Subject No." colSpan="col-span-2" value={formData.subject_number} onChange={onChange} disabled={isLoading} />

                    {/* SECTION 4: Classification */}
                    <div className="sm:col-span-full mt-2">
                        <label htmlFor="subcategory_ids" className={LABEL_CLASS}>Categories / Genres</label>
                        <select
                            id="subcategory_ids"
                            name="subcategory_ids"
                            multiple
                            value={formData.subcategory_ids}
                            onChange={onSubcategoryChange}
                            size="4"
                            className={`${INPUT_BASE_CLASS} h-32`}
                            disabled={isDropdownLoading || isLoading}
                        >
                            {isDropdownLoading && <option>Loading categories...</option>}
                            {subcategories.map((sub) => (
                                <option key={sub.id} value={sub.id}>
                                    {sub.category?.name} &rsaquo; {sub.name}
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">Hold Ctrl (Cmd) to select multiple items.</p>
                    </div>

                    {/* SECTION 5: Details */}
                    <TextAreaField id="description" name="description" label="Description" value={formData.description} onChange={onChange} disabled={isLoading} />
                    <TextAreaField id="remarks" name="remarks" label="Remarks / Condition" value={formData.remarks} onChange={onChange} disabled={isLoading} />

                    {/* SECTION 6: Files */}
                    <div className="sm:col-span-full border-b border-gray-900/10 pb-4 mb-2 mt-4">
                        <h2 className="text-base font-semibold leading-7 text-gray-900">📂 Attachments</h2>
                    </div>

                    <FileInput 
                        id="coverImageFile" 
                        label="Cover Image" 
                        accept="image/*" 
                        onChange={onFileChange} 
                        currentUrl={initialData?.cover_image_url} 
                        newFileName={coverImageName}
                        apiBaseUrl={API_URL}
                    />
                    
                    <FileInput 
                        id="pdfFile" 
                        label="Book PDF Document" 
                        accept="application/pdf" 
                        onChange={onFileChange} 
                        currentUrl={initialData?.pdf_url} 
                        newFileName={pdfFileName}
                        apiBaseUrl={API_URL}
                    />

                    {/* SECTION 7: Flags */}
                    <div className="sm:col-span-full mt-4 space-y-4">
                        <div className="relative flex gap-x-3">
                            <div className="flex h-6 items-center">
                                <input id="is_restricted" name="is_restricted" type="checkbox" checked={formData.is_restricted} onChange={onChange} disabled={isLoading} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
                            </div>
                            <div className="text-sm leading-6">
                                <label htmlFor="is_restricted" className="font-medium text-gray-900">Restricted Access</label>
                                <p className="text-gray-500">Users must request permission to view this book.</p>
                            </div>
                        </div>
                        <div className="relative flex gap-x-3">
                            <div className="flex h-6 items-center">
                                <input id="is_digital" name="is_digital" type="checkbox" checked={formData.is_digital} onChange={onChange} disabled={isLoading} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
                            </div>
                            <div className="text-sm leading-6">
                                <label htmlFor="is_digital" className="font-medium text-gray-900">Digital Only</label>
                                <p className="text-gray-500">This book does not have a physical copy in the library.</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* --- Footer Actions --- */}
            <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8 bg-gray-50 rounded-b-xl">
                {isEditing && (
                    <button type="button" className="text-sm font-semibold leading-6 text-gray-900 hover:text-red-600 transition-colors" onClick={() => window.history.back()}>
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isLoading || isDropdownLoading}
                    className="flex items-center gap-2 rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isLoading ? (
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                        isEditing ? <ArrowPathIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />
                    )}
                    {isLoading ? 'Saving...' : (isEditing ? 'Update Book' : 'Add Book')}
                </button>
            </div>
        </form>
    );
};

export default BookFormUI;