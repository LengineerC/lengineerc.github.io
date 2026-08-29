/**
 * Copy text content
 * @param text The content to copy
 * @returns {Promise<boolean>}
 */
export const copyText = async (text: string): Promise<boolean> => {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.readOnly = true;
  textArea.setAttribute('aria-hidden', 'true');
  Object.assign(textArea.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '1px',
    height: '1px',
    padding: '0',
    border: '0',
    opacity: '0',
    pointerEvents: 'none',
    fontSize: '16px',
  });

  document.body.appendChild(textArea);

  try {
    textArea.focus({ preventScroll: true });
    textArea.select();
    textArea.setSelectionRange(0, textArea.value.length);
    if (document.execCommand('copy')) return true;
  } catch (error) {
    console.log('兼容模式复制失败，尝试 Clipboard API', error);
  } finally {
    textArea.remove();
  }

  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(new Error('Clipboard API 超时')), 1500);
        navigator.clipboard.writeText(text).then(
          () => {
            window.clearTimeout(timeout);
            resolve();
          },
          error => {
            window.clearTimeout(timeout);
            reject(error);
          },
        );
      });
      return true;
    } catch (error) {
      console.log('Clipboard API 复制失败', error);
    }
  }

  return false;
};
