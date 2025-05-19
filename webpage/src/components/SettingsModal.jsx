import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button, IconButton } from './ui/Button';
import { Input, Label, FormGroup } from './ui/Input';
import { usePrompts } from '../context/PromptContext';
import { useSettings } from '../context/SettingsContext';
// Import the utility functions
import { exportPromptData, importPromptData } from '../lib/importExportUtil';
import { showToast } from '../lib/toastUtil';

export function SettingsModal({ isOpen, onClose }) {
  const { settings, updateSettings } = useSettings();
  const { 
    userCategories, 
    CORE_CATEGORIES, 
    MAX_USER_CATEGORIES,
    addCategory,
    updateCategory,
    deleteCategory,
    refreshData
  } = usePrompts();
  
  const [fontSize, setFontSize] = useState(settings.fontSize || 'medium');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [error, setError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [includeResponses, setIncludeResponses] = useState(true);

  // Update fontSize state when settings change
  useEffect(() => {
    setFontSize(settings.fontSize || 'medium');
  }, [settings]);
  
  const handleFontSizeChange = (size) => {
    setFontSize(size);
  };
  
  const handleAddCategory = async () => {
    try {
      setError('');
      if (!newCategoryName.trim()) {
        setError('Category name cannot be empty.');
        return;
      }
      
      await addCategory(newCategoryName.trim());
      setNewCategoryName('');
    } catch (error) {
      setError(error.message);
    }
  };
  
  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (window.confirm(`Are you sure you want to delete the category "${categoryName}"?\n\nPrompts in this category will NOT be deleted, but they will no longer be assigned to this category.`)) {
      try {
        await deleteCategory(categoryId);
        showToast('Category deleted successfully');
      } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
      }
    }
  };
  
  const handleSaveCategory = async (categoryId, newName) => {
    try {
      if (!newName.trim()) {
        throw new Error('Category name cannot be empty.');
      }
      
      await updateCategory(categoryId, newName.trim());
      setEditingCategory(null);
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
    }
  };
  
  const handleSave = async () => {
    await updateSettings({ fontSize });
    showToast('Settings updated');
    onClose();
  };
  
  const handleImport = async (includeResponses = true) => {
    // Prevent multiple clicks during import
    if (isImporting) return;
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      setIsImporting(true);
      try {
        console.log('Starting import process for file:', file.name);
        const result = await importPromptData(file, {
          skipDuplicates: true,
          includeResponses: includeResponses
        });
        console.log('Import result:', result);
        
        if (result.success) {
          let message = '';
          
          if (result.newPromptsCount === 0 && result.responsesCount === 0) {
            message = `No new data imported - all ${result.duplicateCount} prompts already exist`;
            showToast(message, 'warning');
          } else {
            message = `Imported ${result.newPromptsCount} prompts`;
            
            if (includeResponses && result.responsesCount > 0) {
              message += ` and ${result.responsesCount} responses`;
            }
            
            if (result.duplicateCount > 0) {
              message += ` (${result.duplicateCount} duplicates skipped)`;
            }
            
            showToast(message);
            
            // If data was imported, refresh the context and close the modal
            if (result.newPromptsCount > 0 || result.responsesCount > 0) {
              // Apply a loading state while refreshing data
              showToast('Refreshing data...', 'info');
              
              setTimeout(async () => {
                // Refresh data from the database
                const refreshSuccess = await refreshData();
                
                if (refreshSuccess) {
                  showToast('Data refreshed successfully');
                  onClose();
                } else {
                  showToast('Error refreshing data. Please reload the page.', 'error');
                }
              }, 1000);
            }
          }
        } else {
          showToast(`Import failed: ${result.error}`, 'error');
        }
      } catch (error) {
        console.error('Import error:', error);
        showToast(`Import failed: ${error.message}`, 'error');
      } finally {
        setIsImporting(false);
      }
    };
    
    fileInput.click();
  };
  
  const handleExport = async (includeResponses = true) => {
    const success = await exportPromptData(includeResponses);
    if (success) {
      const message = includeResponses
        ? 'Prompts and responses exported successfully'
        : 'Prompts exported successfully';
      showToast(message);
    }
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      footer={
        <>
          <Button 
            variant="secondary" 
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            variant="primary"
            onClick={handleSave}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Display Settings */}
        <section>
          <h3 className="text-sm font-medium mb-2">Display Settings</h3>
          
          {/* Text Size */}
          <div className="mb-4">
            <h4 className="text-xs font-medium text-gray-600 mb-2">Text Size</h4>
            <div className="flex items-center space-x-4">
              <label className="inline-flex items-center cursor-pointer">
                <input 
                  type="radio" 
                  name="fontSize" 
                  value="small"
                  checked={fontSize === 'small'}
                  onChange={() => handleFontSizeChange('small')}
                  className="sr-only"
                />
                <div className={`px-3 py-1 rounded border ${fontSize === 'small' ? 'bg-blue-100 border-blue-500 text-blue-800' : 'border-gray-300'}`}>
                  <span className="text-xs">Small</span>
                </div>
              </label>
              
              <label className="inline-flex items-center cursor-pointer">
                <input 
                  type="radio" 
                  name="fontSize" 
                  value="medium"
                  checked={fontSize === 'medium'}
                  onChange={() => handleFontSizeChange('medium')}
                  className="sr-only"
                />
                <div className={`px-3 py-1 rounded border ${fontSize === 'medium' ? 'bg-blue-100 border-blue-500 text-blue-800' : 'border-gray-300'}`}>
                  <span className="text-sm">Medium</span>
                </div>
              </label>
              
              <label className="inline-flex items-center cursor-pointer">
                <input 
                  type="radio" 
                  name="fontSize" 
                  value="large"
                  checked={fontSize === 'large'}
                  onChange={() => handleFontSizeChange('large')}
                  className="sr-only"
                />
                <div className={`px-3 py-1 rounded border ${fontSize === 'large' ? 'bg-blue-100 border-blue-500 text-blue-800' : 'border-gray-300'}`}>
                  <span className="text-base">Large</span>
                </div>
              </label>
            </div>
          </div>
          
          {/* Theme Setting */}
          <div>
            <h4 className="text-xs font-medium text-gray-600 mb-2">Color Theme</h4>
            <div className="flex items-center space-x-4">
              <label className="inline-flex items-center cursor-pointer">
                <input 
                  type="radio" 
                  name="theme" 
                  value="light"
                  checked={settings.theme === 'light'}
                  onChange={() => updateSettings({ theme: 'light' })}
                  className="sr-only"
                />
                <div className={`flex items-center px-3 py-1 rounded border ${settings.theme === 'light' ? 'bg-blue-100 border-blue-500 text-blue-800' : 'border-gray-300'}`}>
                  <span className="mr-2" role="img" aria-label="Light mode">☀️</span>
                  <span className="text-sm">Light</span>
                </div>
              </label>
              
              <label className="inline-flex items-center cursor-pointer">
                <input 
                  type="radio" 
                  name="theme" 
                  value="dark"
                  checked={settings.theme === 'dark'}
                  onChange={() => updateSettings({ theme: 'dark' })}
                  className="sr-only"
                />
                <div className={`flex items-center px-3 py-1 rounded border ${settings.theme === 'dark' ? 'bg-blue-100 border-blue-500 text-blue-800' : 'border-gray-300'}`}>
                  <span className="mr-2" role="img" aria-label="Dark mode">🌙</span>
                  <span className="text-sm">Dark</span>
                </div>
              </label>
            </div>
          </div>
        </section>
        
        {/* Category Management */}
        <section className="border-t pt-4">
          <h3 className="text-sm font-medium mb-2">Category Management</h3>
          
          <div className="mb-4">
            <h4 className="text-xs font-medium text-gray-600 mb-2">
              Your Categories (Max {MAX_USER_CATEGORIES})
            </h4>
            
            {userCategories.length === 0 ? (
              <p className="text-gray-400 italic text-sm">No custom categories added yet.</p>
            ) : (
              <ul className="space-y-2">
                {userCategories.map((category) => (
                  <li 
                    key={category.id}
                    className="flex items-center justify-between py-1 group border-b border-gray-100"
                  >
                    {editingCategory === category.id ? (
                      <div className="flex-grow mr-2">
                        <Input
                          defaultValue={category.name}
                          placeholder="Category name"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveCategory(category.id, e.target.value);
                            } else if (e.key === 'Escape') {
                              setEditingCategory(null);
                            }
                          }}
                          autoFocus
                        />
                        <div className="flex gap-1 mt-1">
                          <Button
                            variant="primary"
                            size="small"
                            onClick={(e) => handleSaveCategory(category.id, e.target.previousElementSibling.value)}
                          >
                            Save
                          </Button>
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() => setEditingCategory(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="block">{category.name}</span>
                        <div className="flex gap-2">
                          <IconButton
                            title="Edit Name"
                            onClick={() => setEditingCategory(category.id)}
                            icon={
                              <svg 
                                className="w-4 h-4" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24" 
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  strokeWidth="2" 
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            }
                          />
                          <IconButton
                            title="Delete Category"
                            variant="danger"
                            onClick={() => handleDeleteCategory(category.id, category.name)}
                            icon={
                              <svg 
                                className="w-4 h-4" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24" 
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  strokeWidth="2" 
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            }
                          />
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className={`${userCategories.length >= MAX_USER_CATEGORIES ? 'opacity-50' : ''}`}>
            <h4 className="text-xs font-medium text-gray-600 mb-2">Add New Category</h4>
            <div className="flex gap-2">
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name..."
                disabled={userCategories.length >= MAX_USER_CATEGORIES}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCategory();
                  }
                }}
              />
              <Button
                onClick={handleAddCategory}
                disabled={userCategories.length >= MAX_USER_CATEGORIES}
                variant="primary"
              >
                Add
              </Button>
            </div>
            {error && (
              <p className="text-xs text-red-500 mt-1">{error}</p>
            )}
            {userCategories.length >= MAX_USER_CATEGORIES && (
              <p className="text-xs text-amber-500 mt-1">
                Maximum of {MAX_USER_CATEGORIES} custom categories reached.
              </p>
            )}
          </div>
        </section>
        
        {/* Import/Export */}
        <section className="border-t pt-4">
          <h3 className="text-sm font-medium mb-2">Data Management</h3>
          <p className="text-xs text-gray-600 mb-3">
            Export your prompts or import a pack.
          </p>
          
          {/* Response option */}
          <div className="mb-4 flex items-center">
            <input
              id="includeResponses"
              type="checkbox"
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
              defaultChecked={true}
              onChange={(e) => {
                // Store the preference in a data attribute
                e.target.closest('section').dataset.includeResponses = e.target.checked;
              }}
            />
            <label htmlFor="includeResponses" className="ml-2 text-sm text-gray-600">
              Include AI responses in export/import
            </label>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={(e) => {
                const includeResponses = e.target.closest('section').dataset.includeResponses !== 'false';
                handleExport(includeResponses);
              }}
            >
              Export
            </Button>
            <Button
              variant="secondary"
              onClick={(e) => {
                const includeResponses = e.target.closest('section').dataset.includeResponses !== 'false';
                handleImport(includeResponses);
              }}
              disabled={isImporting}
            >
              {isImporting ? 'Importing...' : 'Import'}
            </Button>
          </div>
        </section>
      </div>
    </Modal>
  );
}