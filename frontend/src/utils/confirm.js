let resolveConfirm = null;

export const confirmDialog = (message) => {
  return new Promise((resolve) => {
    resolveConfirm = resolve;
    window.dispatchEvent(new CustomEvent('global-confirm', { detail: { message } }));
  });
};

export const resolveGlobalConfirm = (result) => {
  if (resolveConfirm) resolveConfirm(result);
  resolveConfirm = null;
  window.dispatchEvent(new CustomEvent('global-confirm', { detail: null }));
};
