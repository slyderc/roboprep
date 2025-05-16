/**
 * Shows a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Toast type (success, error, warning)
 * @param {number} duration - Duration in milliseconds
 */
export function showToast(message, type = 'success', duration = 3000) {
  const toastId = 'global-toast-notification';
  
  // Remove existing toast first to prevent overlap
  const existingToast = document.getElementById(toastId);
  if (existingToast) {
    existingToast.remove();
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.id = toastId;
  
  let bgColor = 'bg-green-500'; // Success default
  if (type === 'error') bgColor = 'bg-red-500';
  if (type === 'warning') bgColor = 'bg-yellow-500';
  
  // Add base classes + initial state for animation
  toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg ${bgColor} text-white text-sm transition-opacity duration-300 ease-in-out z-[9999] opacity-0`;
  
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Trigger fade in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.remove('opacity-0');
      toast.classList.add('opacity-100');
    });
  });
  
  // Set timeout to start fade out and remove
  setTimeout(() => {
    toast.classList.remove('opacity-100');
    toast.classList.add('opacity-0');
    
    // Remove after fade out transition
    toast.addEventListener('transitionend', () => {
      // Check if the toast still exists before removing
      const currentToast = document.getElementById(toastId);
      if (currentToast === toast) {
        currentToast.remove();
      }
    }, { once: true });
  }, duration);
}