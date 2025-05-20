import React, { useState } from 'react';
import { IconButton } from './ui/Button';
import { SettingsModal } from './SettingsModal';
import { NewPromptModal } from './NewPromptModal';
import { ThemeToggle } from './ThemeToggle';

export function Header({ onOpenNewPrompt }) {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isNewPromptModalOpen, setIsNewPromptModalOpen] = useState(false);
  
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-[10]">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        <div className="flex flex-col">
          <div className="flex items-center">
            <img 
              src="/assets/logo/logo-roboShowprep-popup.png" 
              alt="Robo Show Prep" 
              className="h-8"
            />
          </div>
          <div className="flex flex-col mt-0.5 leading-tight">
            <a 
              href="https://nowwave.radio" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] hover:underline text-gray-600 dark:text-gray-400"
            >
              Created by Now Wave Radio and Anthropic's Claude Code
            </a>
            <a 
              href="https://chromewebstore.google.com/detail/robo-show-prep-from-radio/fphfdmejmkckehhfdloonohbmodbefil" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] hover:underline text-gray-600 dark:text-gray-400"
            >
              Based on the Robo Show Prep Chrome extension by RadioDJ Dude
            </a>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          <IconButton
            title="Settings"
            onClick={() => setIsSettingsModalOpen(true)}
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            }
          />
        </div>
      
        {/* Modals */}
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
        />
        
        <NewPromptModal
          isOpen={isNewPromptModalOpen}
          onClose={() => setIsNewPromptModalOpen(false)}
        />
      </div>
    </header>
  );
}
