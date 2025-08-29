// import { autoUpdate } from '@floating-ui/dom';
// import { flip, offset, shift, useFloating } from '@floating-ui/react';
// import React, { useEffect } from 'react';

// const LightweightPopover = ({
//   isOpen,
//   referenceElement,
//   children,
//   className = '',
// }) => {
//   const { x, y, strategy, update, refs } = useFloating({
//     placement: 'bottom-start',
//     middleware: [offset(8), flip(), shift()],
//   });

//   // Set the reference element
//   useEffect(() => {
//     if (referenceElement) {
//       refs.setReference(referenceElement);
//     }
//   }, [referenceElement, refs]);

//   // Auto update on reference element move
//   useEffect(() => {
//     if (isOpen && referenceElement && refs.floating.current) {
//       return autoUpdate(
//         referenceElement, 
//         refs.floating.current, 
//         update);
//     }
//   }, [isOpen, referenceElement, refs.floating, update]);

//   if (!isOpen || !referenceElement) return null;

//   return (
//     <div
//       ref={refs.setFloating}
//       style={{
//         position: strategy,
//         top: y ?? 0,
//         left: x ?? 0,
//       }}
//       className={className}
//     >
//       {children}
//     </div>
//   );
// };

// export default LightweightPopover;
