// src/components/common/Modal.jsx
import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react'; // Import Headless UI components
import { XMarkIcon } from '@heroicons/react/24/outline'; // Import close icon

/**
 * Modern Modal using Headless UI and Tailwind CSS.
 * @param {object} props
 * @param {boolean} props.isOpen - Controls modal visibility.
 * @param {function} props.onClose - Function to call when closing the modal.
 * @param {string} [props.title] - Optional title for the modal header.
 * @param {React.ReactNode} props.children - Content for the modal body.
 * @param {string} [props.size='max-w-xl'] - Tailwind max-width class (e.g., 'max-w-md', 'max-w-3xl').
 */
const Modal = ({ isOpen, onClose, title, children, size = 'max-w-xl' }) => {
    return (
        // Transition for smooth entry/exit animations
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-30" onClose={onClose}> {/* High z-index */}
                
                {/* Overlay Transition */}
                <Transition.Child
                    // as={Fragment} // <-- THIS LINE WAS REMOVED
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    {/* This div is now the direct child and will receive the props */}
                    <div className="fixed inset-0 bg-black bg-opacity-40 transition-opacity" />
                </Transition.Child>

                {/* Modal Content Container */}
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                         
                         {/* Modal Panel Transition */}
                        <Transition.Child
                            // as={Fragment} // <-- THIS LINE WAS REMOVED
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 scale-95 translate-y-4 sm:translate-y-0"
                            enterTo="opacity-100 scale-100 translate-y-0"
                            leave="ease-in duration-150"
                            leaveFrom="opacity-100 scale-100 translate-y-0"
                            leaveTo="opacity-0 scale-95 translate-y-4 sm:translate-y-0"
                        >
                            {/* This Dialog.Panel is now the direct child and will receive the props */}
                            <Dialog.Panel className={`w-full ${size} transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all`}>
                                {/* Modal Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                    {title && (
                                        <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-800">
                                            {title}
                                        </Dialog.Title>
                                    )}
                                    <button
                                        type="button"
                                        className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md"
                                        onClick={onClose}
                                        aria-label="Close modal"
                                    >
                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>
                                {/* Modal Body */}
                                <div className="p-6">
                                    {children}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default Modal;