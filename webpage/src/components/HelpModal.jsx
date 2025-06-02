import React from 'react';
import { Modal } from './ui/Modal';

export function HelpModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quick Start Guide">
      <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
        <p className="text-base text-gray-800 dark:text-gray-200 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          Robo Show Prep helps radio DJs quickly generate AI-powered show content using a library of customizable prompts for ChatGPT to create artist bios, music facts, weather reports, show segments and more. Copy prompts and results to your clipboard for use wherever you need them!
        </p>
        {/* Getting Started */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
            <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mr-2">1</span>
            Browse Prompts
          </h3>
          <p>Use the <strong>Categories</strong> on the left to explore prompts by type. Click <strong>"All Prompts"</strong> to see everything.</p>
        </div>

        {/* Using Prompts */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
            <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mr-2">2</span>
            Use Prompts
          </h3>
          <ul className="space-y-1 ml-7 list-disc">
            <li><strong>Copy:</strong> Click any prompt to copy it to clipboard</li>
            <li><strong>AI Generate:</strong> Click the blue "Submit to AI" button for instant content</li>
            <li><strong>Variables:</strong> Prompts with variables (like {'{artist}'}) will open a form to customize</li>
          </ul>
        </div>

        {/* Filtering */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
            <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mr-2">3</span>
            Find Prompts Faster
          </h3>
          <ul className="space-y-1 ml-7 list-disc">
            <li>Use the <strong>"FILTER BY TAGS"</strong> panel to narrow results</li>
            <li>Check <strong>"Recently Used"</strong> for your most recent prompts</li>
            <li>Mark favorites by clicking the star icon on any prompt</li>
          </ul>
        </div>

        {/* AI Features */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
            <span className="bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mr-2">AI</span>
            AI Integration
          </h3>
          <ul className="space-y-1 ml-7 list-disc">
            <li>Generated content is automatically saved to your <strong>Response History</strong></li>
            <li>Click the history icon to view, edit, or regenerate responses</li>
            <li>Responses can be exported along with your prompts</li>
          </ul>
        </div>

        {/* Quick Tips */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">💡 Pro Tips</h3>
          <ul className="space-y-1 text-xs text-blue-800 dark:text-blue-300 list-disc ml-4">
            <li>Prompts without variables copy instantly when clicked</li>
            <li>Use Settings (⚙️) to switch themes and manage your account</li>
            <li>Create custom prompts using the "+" button in Settings</li>
            <li>Export your data anytime from the Settings menu</li>
          </ul>
        </div>
      </div>
      
      <div className="flex justify-end mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Got it!
        </button>
      </div>
    </Modal>
  );
}
