import React from 'react';
import CleanNavbar from './CleanNavbar';
import Breadcrumb from './Breadcrumb';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-50">
            <CleanNavbar />
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <Breadcrumb />
                {children}
            </main>
        </div>
    );
};

export default Layout;