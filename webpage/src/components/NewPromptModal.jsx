import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './ui/Modal';
import { Button, IconButton } from './ui/Button';
import { Input, TextArea, Select, Label, FormGroup } from './ui/Input';
import { usePrompts } from '../context/PromptContext';
import { showToast } from '../lib/toastUtil';

export function NewPromptModal({ isOpen, onClose, promptToEdit = null }) {
  const { CORE_CATEGORIES, userCategories, addPrompt, updatePrompt } = usePrompts();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [promptText, setPromptText] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [charCount, setCharCount] = useState(0);
  
  const tagInputRef = useRef(null);
  const titleInputRef = useRef(null);
  
  const isEditing = !!promptToEdit;
  
  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        // Fill form with existing prompt data
        setTitle(promptToEdit.title || '');
        setDescription(promptToEdit.description || '');
        setCategory(promptToEdit.category || '');
        
        // Normalize newlines in promptText
        const normalizedPromptText = promptToEdit.promptText.replace(/\\n/g, '\n');
        setPromptText(normalizedPromptText);
        
        setTags(promptToEdit.tags || []);
        setCharCount(promptToEdit.description?.length || 0);
      } else {
        // Clear form for new prompt
        setTitle('');
        setDescription('');
        setCategory('');
        setPromptText('');
        setTags([]);
        setCharCount(0);
      }
      
      setTagInput('');
    }
  }, [isOpen, isEditing, promptToEdit]);
  
  // Focus first input when modal opens
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      setTimeout(() => {
        titleInputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);
  
  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    if (value.length <= 200) {
      setDescription(value);
      setCharCount(value.length);
    }
  };
  
  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().replace(/,/g, '');
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };
  
  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleSave = async () => {
    if (!title.trim()) {
      showToast('Please enter a title for the prompt.', 'error');
      titleInputRef.current?.focus();
      return;
    }
    
    if (!promptText.trim()) {
      showToast('Please enter the prompt text.', 'error');
      return;
    }
    
    try {
      if (isEditing) {
        // Update existing prompt
        const success = await updatePrompt({
          ...promptToEdit,
          title: title.trim(),
          description: description.trim(),
          category: category || null,
          promptText: promptText.trim(),
          tags: [...tags],
        });
        
        if (success) {
          showToast('Prompt updated successfully!');
          onClose();
        } else {
          showToast('Failed to update prompt.', 'error');
        }
      } else {
        // Add new prompt
        const newPrompt = await addPrompt({
          title: title.trim(),
          description: description.trim(),
          category: category || null,
          promptText: promptText.trim(),
          tags: [...tags],
        });
        
        if (newPrompt) {
          showToast('Prompt created successfully!');
          onClose();
        } else {
          showToast('Failed to create prompt.', 'error');
        }
      }
    } catch (error) {
      console.error('Error saving prompt:', error);
      showToast(`Error: ${error.message}`, 'error');
    }
  };
  
  // Combine core and user categories for the dropdown
  const allCategories = [
    ...CORE_CATEGORIES,
    ...userCategories
  ].sort((a, b) => a.name.localeCompare(b.name));
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Prompt' : 'New Prompt'}
      maxWidth="lg"
      footer={
        <div className="flex justify-between w-full">
          <Button 
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handleSave}
          >
            {isEditing ? 'Save Changes' : 'Create Prompt'}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <FormGroup>
            <Label htmlFor="promptTitle">Title*</Label>
            <Input
              id="promptTitle"
              ref={titleInputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Artist Introduction Template"
              required
            />
          </FormGroup>
          
          <FormGroup>
            <div className="flex items-center justify-between">
              <Label htmlFor="promptDescription">
                Description <span className="text-gray-500 dark:text-gray-400">(Optional)</span>
              </Label>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {charCount}/200
              </span>
            </div>
            <TextArea
              id="promptDescription"
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Brief description of when/how to use this prompt"
              className="resize-none h-20"
              maxLength={200}
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="promptCategory">Category</Label>
            <Select
              id="promptCategory"
              value={category || ''}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">-- Select Category --</option>
              {allCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </FormGroup>
          
          <FormGroup>
            <Label>Tags <span className="text-gray-500 dark:text-gray-400">(Optional)</span></Label>
            <div className="flex flex-wrap gap-2 mb-2 p-2 border border-gray-200 dark:border-gray-700 rounded-md min-h-[60px] dark:bg-gray-800">
              {tags.map((tag, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300"
                >
                  {tag}
                  <button
                    type="button"
                    className="ml-1 text-blue-400 dark:text-blue-300 hover:text-blue-600 dark:hover:text-blue-200"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    ×
                  </button>
                </span>
              ))}
              {tags.length === 0 && (
                <span className="text-gray-400 dark:text-gray-500 text-sm italic">No tags added yet</span>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                ref={tagInputRef}
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Type a tag and press Enter..."
                className="flex-grow"
              />
              <Button
                onClick={handleAddTag}
                type="button"
                variant="secondary"
                size="small"
              >
                Add
              </Button>
            </div>
          </FormGroup>
        </div>
        
        <FormGroup className="md:col-span-2">
          <Label htmlFor="promptText">Prompt Text*</Label>
          <TextArea
            id="promptText"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Enter your prompt text here. Use {{variable_name}} syntax for parts that should be customizable."
            className="font-mono text-sm resize-y h-36 min-h-[9rem]"
            required
          />
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-left">
            <span>⟺ Drag bottom edge to resize</span>
          </div>
        </FormGroup>
      </div>
    </Modal>
  );
}