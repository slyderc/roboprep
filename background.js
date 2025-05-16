chrome.runtime.onInstalled.addListener(() => {
    // Initialize storage with default values
    chrome.storage.local.get(['userPrompts', 'favorites', 'recentlyUsed', 'settings'], (result) => {
      if (!result.userPrompts) {
        chrome.storage.local.set({ userPrompts: [] });
      }
      if (!result.favorites) {
        chrome.storage.local.set({ favorites: [] });
      }
      if (!result.recentlyUsed) {
        chrome.storage.local.set({ recentlyUsed: [] });
      }
      if (!result.settings) {
        chrome.storage.local.set({ 
          settings: {
            defaultView: 'sidebar',
            syncEnabled: false,
            userID: null
          }
        });
      }
    });
    
    // Explicitly set side panel NOT to open on extension icon click
    if (chrome.sidePanel) {
      chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
    }
  });
  
  // Handle messages from content scripts or popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "openFloatingWindow") {
      chrome.windows.create({
        url: chrome.runtime.getURL("popup/popup.html?mode=floating"),
        type: "popup",
        width: 650,
        height: 800
      });
    }
    
    // Other message handlers would go here
    
    return true; // Required for async response
  });