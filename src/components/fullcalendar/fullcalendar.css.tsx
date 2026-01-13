/**
 * We have to input the drop shadow style overrides manually to avoid the preprocessor.
 * Even though scroll-state container queries are supported in every browser,
 * the are not yet adopted by lightningCSS which is used by turbopack.
 * Once this is fixed this can be moved into the fullcalendar.css file.
 */
export function FullCalendarDropShadowStyleOverrides() {
  return (
    <style>{`
.fc-scrollgrid-section-body .fc-scroller.fc-scroller-liquid-absolute {
  container-type: scroll-state;
  container-name: fc-body;
}

.fc-scrollgrid-section-body .fc-scroller.fc-scroller-liquid-absolute::before {
  content: "";
  position: sticky;
  top: -10px;
  margin-top: -10px;
  display: block;
  height: 10px;
  pointer-events: none;
  z-index: 10;
  opacity: 0;
  box-shadow: var(--shadow-bottom);
  transition: opacity 160ms ease;
}

@container fc-body scroll-state(scrollable: top) {
  .fc-scrollgrid-section-body .fc-scroller.fc-scroller-liquid-absolute::before {
    opacity: 1;
  }
}
  `}</style>
  );
}
