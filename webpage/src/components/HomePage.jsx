import React, { useState } from 'react';
import { Header } from './Header';
import { CategoryList } from './CategoryList';
import { PromptList } from './PromptList';
import { Button } from './ui/Button';
import { NewPromptModal } from './NewPromptModal';

export function HomePage() {
  const [isNewPromptModalOpen, setIsNewPromptModalOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Sidebar */}
          <div className="col-span-12 sm:col-span-3 xl:col-span-2 bg-white shadow rounded-lg overflow-hidden">
            <CategoryList />
          </div>
          
          {/* Main Content */}
          <div className="col-span-12 sm:col-span-9 xl:col-span-10 bg-white shadow rounded-lg px-3 py-2 md:px-4">
            <PromptList />
          </div>
        </div>
      </main>
      
      {/* Floating New Prompt Button (Mobile) */}
      <div className="sm:hidden fixed bottom-4 right-4">
        <Button
          variant="primary"
          className="rounded-full shadow-lg px-4 py-3"
          onClick={() => setIsNewPromptModalOpen(true)}
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          }
        >
          New Prompt
        </Button>
      </div>
      
      {/* New Prompt Modal */}
      <NewPromptModal
        isOpen={isNewPromptModalOpen}
        onClose={() => setIsNewPromptModalOpen(false)}
      />
    </div>
  );
}