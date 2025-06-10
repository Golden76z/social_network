// // hooks/useCssVariables.ts
// import { useEffect, useState } from 'react';

// export const useCssVariables = () => {
//   const [variables, setVariables] = useState<Record<string, string>>({});

//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       const root = document.documentElement;
//       const cssVariables: Record<string, string> = {};

//       // Get all CSS variables
//       const styles = getComputedStyle(root);
//       const variableNames = Array.from(styles).filter(name => name.startsWith('--'));
      
//       variableNames.forEach(name => {
//         cssVariables[name] = styles.getPropertyValue(name).trim();
//       });

//       setVariables(cssVariables);
//     }
//   }, []);

//   return variables;
// };