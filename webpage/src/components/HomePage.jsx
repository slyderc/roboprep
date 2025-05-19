import React, { useState } from 'react';
import { Header } from './Header';
import { CategoryList } from './CategoryList';
import { PromptList } from './PromptList';
import { Button } from './ui/Button';
import { NewPromptModal } from './NewPromptModal';
import { ResponseModal } from './ResponseModal';
import { ResponseHistoryModal } from './ResponseHistoryModal';
import { ResponseListModal } from './ResponseListModal';
import { usePrompts } from '../context/PromptContext';

export function HomePage() {
  const { submitPromptToAi, getResponsesForPrompt } = usePrompts();
  const [isNewPromptModalOpen, setIsNewPromptModalOpen] = useState(false);
  
  // States for OpenAI integration
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [responseListModalOpen, setResponseListModalOpen] = useState(false);
  const [responseHistoryModalOpen, setResponseHistoryModalOpen] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [responseError, setResponseError] = useState(null);
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0);
  const [responsesList, setResponsesList] = useState([]);
  
  // Handler for submitting prompt to AI
  const handleSubmitToAi = async (prompt, variables = {}) => {
    setCurrentPrompt(prompt);
    setResponseError(null);
    setAiResponse(null);
    setIsLoading(true);
    setResponseModalOpen(true);
    
    try {
      const result = await submitPromptToAi(prompt, variables);
      setAiResponse(result);
    } catch (error) {
      console.error('Error submitting to AI:', error);
      setResponseError(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handler for viewing response history
  const handleViewResponses = (prompt) => {
    setCurrentPrompt(prompt);
    
    // Get responses for this prompt
    const responses = getResponsesForPrompt(prompt.id);
    setResponsesList(responses);
    
    // Show the response list modal first
    setResponseListModalOpen(true);
  };
  
  // Handler for selecting a response from the list
  const handleSelectResponse = (index) => {
    setCurrentResponseIndex(index);
    setResponseListModalOpen(false);
    setResponseHistoryModalOpen(true);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-4">
        <div className="grid grid-cols-12 gap-4 relative min-h-[calc(100vh-100px)]">
          {/* Sidebar - Fixed position on desktop */}
          <div className="col-span-12 sm:col-span-3 xl:col-span-2">
            <div className="bg-white shadow rounded-lg overflow-hidden sticky top-4">
              <CategoryList />
            </div>
          </div>
          
          {/* Main Content - Scrollable */}
          <div className="col-span-12 sm:col-span-9 xl:col-span-10 overflow-y-auto max-h-[calc(100vh-120px)]">
            <PromptList 
              onSubmitToAi={handleSubmitToAi}
              onViewResponses={handleViewResponses}
            />
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
      
      {/* Modals */}
      <NewPromptModal
        isOpen={isNewPromptModalOpen}
        onClose={() => setIsNewPromptModalOpen(false)}
      />
      
      <ResponseModal
        isOpen={responseModalOpen}
        onClose={() => setResponseModalOpen(false)}
        promptData={currentPrompt}
        response={aiResponse}
        loading={isLoading}
        error={responseError}
        onNewResponse={(prompt) => {
          // Close the current response modal
          setResponseModalOpen(false);
          
          // Wait for modal to close, then trigger a new AI request
          setTimeout(() => {
            handleSubmitToAi(prompt);
          }, 300);
        }}
      />
      
      <ResponseListModal
        isOpen={responseListModalOpen}
        onClose={() => setResponseListModalOpen(false)}
        responses={responsesList}
        onSelectResponse={handleSelectResponse}
        promptData={currentPrompt}
      />
      
      <ResponseHistoryModal
        isOpen={responseHistoryModalOpen}
        onClose={() => {
          setResponseHistoryModalOpen(false);
          
          // Refresh the responses list to ensure deleted items are removed
          if (currentPrompt?.id) {
            const updatedResponses = getResponsesForPrompt(currentPrompt.id);
            setResponsesList(updatedResponses);
            
            // Only return to the list view if there are still responses left
            if (updatedResponses.length > 0) {
              setResponseListModalOpen(true);
            }
          }
        }}
        promptId={currentPrompt?.id}
        initialIndex={currentResponseIndex}
        onResponseDeleted={(deletedResponseId) => {
          // Refresh the responses list when a response is deleted
          if (currentPrompt?.id) {
            const updatedResponses = getResponsesForPrompt(currentPrompt.id);
            setResponsesList(updatedResponses);
          }
        }}
      />
    </div>
  );
}