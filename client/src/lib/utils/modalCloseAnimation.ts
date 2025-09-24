/**
 * Simple utility for modal closing animations
 */

export const animateModalClose = (onClose: () => void, backdropRef?: React.RefObject<HTMLElement>, contentRef?: React.RefObject<HTMLElement>) => {
  if (backdropRef?.current && contentRef?.current) {
    // Add closing animation classes
    contentRef.current.classList.add('modal-closing');
    backdropRef.current.classList.add('modal-backdrop-closing');
    
    // Close after animation completes
    setTimeout(() => {
      contentRef.current!.classList.remove('modal-closing');
      backdropRef.current!.classList.remove('modal-backdrop-closing');
      onClose();
    }, 300);
  } else {
    // Fallback: close immediately
    onClose();
  }
};
