export const notify = (message, type = 'error') => {
  window.dispatchEvent(new CustomEvent('global-toast', { detail: { message, type } }));
};
