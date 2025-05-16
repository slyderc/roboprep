'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { CategoryList } from '../components/CategoryList';
import { PromptList } from '../components/PromptList';
import { Button } from '../components/ui/Button';
import { NewPromptModal } from '../components/NewPromptModal';

export default function Home() {
  const [isNewPromptModalOpen, setIsNewPromptModalOpen] = useState(false);
  
  // Debug function to inspect localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('Debug storage check:');
      
      // Check localStorage contents
      try {
        const userPrompts = JSON.parse(localStorage.getItem('userPrompts') || '[]');
        console.log('User prompts count:', userPrompts.length);
        console.log('User prompts:', userPrompts);
        
        // Check for 'show-segments' category prompts
        const showSegments = userPrompts.filter(p => p.category === 'show-segments');
        console.log('Show Segments prompts:', showSegments);
        
        // Check for NNW Show Opening prompts
        const nnwPrompts = userPrompts.filter(p => 
          p.title && p.title.includes('NNW Show Opening')
        );
        console.log('NNW prompts:', nnwPrompts);
      } catch (err) {
        console.error('Error reading localStorage:', err);
      }
    }
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1 bg-white shadow rounded-lg">
            <CategoryList />
          </div>
          
          {/* Main Content */}
          <div className="md:col-span-3 bg-white shadow rounded-lg px-6">
            <PromptList />
          </div>
        </div>
      </main>
      
      {/* Floating New Prompt Button (Mobile) */}
      <div className="md:hidden fixed bottom-4 right-4">
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