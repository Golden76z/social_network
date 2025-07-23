// 'use client';

// import { useCallback, useEffect, useState } from 'react';

// // Google Identity Services types
// interface GoogleCredentialResponse {
//   credential: string;
//   select_by: string;
// }

// interface GoogleAccounts {
//   id: {
//     initialize: (config: GoogleInitConfig) => void;
//     prompt: (callback?: (notification: GooglePromptNotification) => void) => void;
//     renderButton: (parent: HTMLElement, options: GoogleButtonConfig) => void;
//     disableAutoSelect: () => void;
//     cancel: () => void;
//   };
// }

// interface GoogleInitConfig {
//   client_id: string;
//   callback: (response: GoogleCredentialResponse) => void;
//   auto_select?: boolean;
//   cancel_on_tap_outside?: boolean;
//   context?: 'signin' | 'signup' | 'use';
// }

// interface GooglePromptNotification {
//   isNotDisplayed: () => boolean;
//   isSkippedMoment: () => boolean;
//   isDismissedMoment: () => boolean;
//   getNotDisplayedReason: () => string;
//   getSkippedReason: () => string;
//   getDismissedReason: () => string;
// }

// interface GoogleButtonConfig {
//   type?: 'standard' | 'icon';
//   theme?: 'outline' | 'filled_blue' | 'filled_black';
//   size?: 'large' | 'medium' | 'small';
//   text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
//   shape?: 'rectangular' | 'pill' | 'circle' | 'square';
//   logo_alignment?: 'left' | 'center';
//   width?: number;
//   locale?: string;
// }

// // Extend Window interface
// declare global {
//   interface Window {
//     google?: {
//       accounts: GoogleAccounts;
//     };
//   }
// }

// interface UseGoogleSignInOptions {
//   clientId?: string;
//   onSuccess?: (response: GoogleCredentialResponse) => void;
//   onError?: (error: Error) => void;
//   autoSelect?: boolean;
//   cancelOnTapOutside?: boolean;
// }

// interface UseGoogleSignInReturn {
//   isLoaded: boolean;
//   isInitialized: boolean;
//   signIn: () => Promise<void>;
//   renderButton: (element: HTMLElement, config?: GoogleButtonConfig) => void;
//   error: string | null;
// }

// export const useGoogleSignIn = (options: UseGoogleSignInOptions = {}): UseGoogleSignInReturn => {
//   const [isLoaded, setIsLoaded] = useState(false);
//   const [isInitialized, setIsInitialized] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const {
//     clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
//     onSuccess,
//     onError,
//     autoSelect = false,
//     cancelOnTapOutside = true,
//   } = options;

//   // Load Google Identity Services script
//   useEffect(() => {
    
//     const loadGoogleScript = async () => {
//       try {
//         // Check if already loaded
//         if (window.google?.accounts) {
//           setIsLoaded(true);
//           return;
//         }

//         // Load script
//         const script = document.createElement('script');
//         script.src = 'https://accounts.google.com/gsi/client';
//         script.async = true;
//         script.defer = true;
        
//         const loadPromise = new Promise<void>((resolve, reject) => {
//           script.onload = () => resolve();
//           script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
//         });

//         document.head.appendChild(script);
//         await loadPromise;
        
//         setIsLoaded(true);
//       } catch (err) {
//         const errorMessage = err instanceof Error ? err.message : 'Failed to load Google Sign-In';
//         setError(errorMessage);
//         onError?.(new Error(errorMessage));
//       }
//     };

//     loadGoogleScript();
//   }, [onError]);

//   // Initialize Google Sign-In
//   useEffect(() => {
//     if (!isLoaded || !clientId || isInitialized) return;

//     try {
//       if (!window.google?.accounts) {
//         throw new Error('Google Identity Services not loaded');
//       }

//       window.google.accounts.id.initialize({
//         client_id: clientId,
//         callback: (response: GoogleCredentialResponse) => {
//           onSuccess?.(response);
//         },
//         auto_select: autoSelect,
//         cancel_on_tap_outside: cancelOnTapOutside,
//       });

//       setIsInitialized(true);
//       setError(null);
//     } catch (err) {
//       const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Google Sign-In';
//       setError(errorMessage);
//       onError?.(new Error(errorMessage));
//     }
//   }, [isLoaded, clientId, isInitialized, onSuccess, onError, autoSelect, cancelOnTapOutside]);

//   // Sign in function
//   const signIn = useCallback(async (): Promise<void> => {
//     try {
//       if (!isInitialized) {
//         throw new Error('Google Sign-In not initialized');
//       }

//       if (!window.google?.accounts) {
//         throw new Error('Google Identity Services not available');
//       }

//       window.google.accounts.id.prompt((notification) => {
//         if (notification.isNotDisplayed()) {
//           const reason = notification.getNotDisplayedReason();
//           onError?.(new Error(`Google Sign-In not displayed: ${reason}`));
//         } else if (notification.isSkippedMoment()) {
//           const reason = notification.getSkippedReason();
//           onError?.(new Error(`Google Sign-In skipped: ${reason}`));
//         } else if (notification.isDismissedMoment()) {
//           const reason = notification.getDismissedReason();
//           onError?.(new Error(`Google Sign-In dismissed: ${reason}`));
//         }
//       });
//     } catch (err) {
//       const errorMessage = err instanceof Error ? err.message : 'Failed to sign in with Google';
//       setError(errorMessage);
//       onError?.(new Error(errorMessage));
//       throw err;
//     }
//   }, [isInitialized, onError]);

//   // Render button function
//   const renderButton = useCallback((element: HTMLElement, config: GoogleButtonConfig = {}): void => {
//     try {
//       if (!isInitialized) {
//         throw new Error('Google Sign-In not initialized');
//       }

//       if (!window.google?.accounts) {
//         throw new Error('Google Identity Services not available');
//       }

//       window.google.accounts.id.renderButton(element, {
//         type: 'standard',
//         theme: 'outline',
//         size: 'large',
//         text: 'signin_with',
//         shape: 'rectangular',
//         logo_alignment: 'left',
//         ...config,
//       });
//     } catch (err) {
//       const errorMessage = err instanceof Error ? err.message : 'Failed to render Google Sign-In button';
//       setError(errorMessage);
//       onError?.(new Error(errorMessage));
//     }
//   }, [isInitialized, onError]);

//   return {
//     isLoaded,
//     isInitialized,
//     signIn,
//     renderButton,
//     error,
//   };
// };