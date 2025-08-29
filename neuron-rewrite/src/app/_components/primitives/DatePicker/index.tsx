// import React, { useRef, useState } from 'react';
// import DatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';
// import NeuronPopover from '../Popover';
// import './index.css';

// function NeuronDatePicker({ type, value = new Date(), onChange }) {
//   if (type !== 'month' && type !== 'week') {
//     console.warn(`Unsupported type: ${type}. Only "month" and "week" are supported.`);
//     return <div>Invalid type: {type}</div>;
//   }

//   const [showPicker, setShowPicker] = useState(false);
//   const popoverTriggerRef = useRef();

//   const formattedValue =
//     type === 'week'
//       ? value?.toLocaleDateString('en-US', {
//           month: 'short',
//           day: 'numeric',
//           year: 'numeric',
//         })
//       : value?.toLocaleString('en-US', {
//           month: 'long',
//           year: 'numeric',
//         });

//   return (
//     <div className="neuron-date-picker">
//       <button
//         ref={popoverTriggerRef}
//         className="date-picker-dropdown"
//         onClick={() => setShowPicker((prev) => !prev)}
//       >
//         {formattedValue}
//         <DropdownSvg/>
//       </button>

//       <NeuronPopover
//         isOpen={showPicker}
//         referenceElement={popoverTriggerRef.current}
//       >
//         <DatePicker
//           selected={value}
//           onChange={(date) => {
//             console.log('date', date);
//             if (onChange) {
//               onChange(date);
//             }
//             setShowPicker(false); // close popover after selection
//           }}
//           dateFormat={type === 'month' ? 'MMM yyyy' : 'yyyy-MM-dd'}
//           inline
//           {...(type === 'month' ? { showMonthYearPicker: true } : {})}
//           {...(type === 'week' ? { showWeekNumbers: true } : {})}
//         />
//       </NeuronPopover>
//     </div>
//   );
// }

// export default NeuronDatePicker;