'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ExpansionUIContextType {
    openModal: (content: ReactNode) => void;
    closeModal: () => void;
}

const ExpansionUIContext = createContext<ExpansionUIContextType | undefined>(undefined);

export function ExpansionUIProvider({ children }: { children: ReactNode }) {
    const [modalContent, setModalContent] = useState<ReactNode | null>(null);

    const openModal = (content: ReactNode) => {
        setModalContent(content);
    };

    const closeModal = () => {
        setModalContent(null);
    };

    return (
        <ExpansionUIContext.Provider value={{ openModal, closeModal }}>
            {children}
            {modalContent && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    {/* 
                       We deliver the content directly. 
                       The content itself should usually handle its own "Container" style if it wants custom size, 
                       OR we provide a default wrapper here.
                       Given expansions might want different sizes (Composer vs Alert), 
                       let's provide a minimal centering wrapper but let content define its box.
                     */}
                    <div className="relative animate-in zoom-in-95 duration-200">
                        {modalContent}
                    </div>
                </div>
            )}
        </ExpansionUIContext.Provider>
    );
}

export function useExpansionUI() {
    const context = useContext(ExpansionUIContext);
    if (!context) {
        throw new Error('useExpansionUI must be used within an ExpansionUIProvider');
    }
    return context;
}
