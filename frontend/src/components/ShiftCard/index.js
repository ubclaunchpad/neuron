import "./index.css";
import { SHIFT_TYPES, COVERAGE_STATUSES } from "../../data/constants";

function ShiftCard({ shift, shiftType, onShiftSelect, buttonConfig }) {
  const handleShiftSelection = () => {
    onShiftSelect(shift);
  };

  const { lineColor, label, icon, disabled, buttonClass, onClick } =
    buttonConfig?.[shiftType] ||
      buttonConfig?.[SHIFT_TYPES.DEFAULT] || {
        lineColor: "var(--grey)",
        label: "View Details",
        icon: null,
        disabled: false,
        onClick: () => {},
      };

  const parseShiftDuration = (duration) => {
    const hours = Math.round((duration / 60) * 10) / 10;
    if (hours === 1) {
      return `${hours} hour`;
    }
    if (hours > 1) {
      return `${hours} hours`;
    }
    return `${duration} minutes`;
  };

  return (
    <div className="shift-card" onClick={handleShiftSelection}>
      <div className="vertical-line" style={{ backgroundColor: lineColor }} />
      <div className="card-content">
        <div className="column segment-1">
          <div className="card-text">
            <h2 className="shift-time">{shift.start_time}</h2>
            <p>{parseShiftDuration(shift.duration)}</p>
          </div>
        </div>
        <div className="column segment-2">
          <div className="card-text">
            <h2>{shift.class_name}</h2>
            <p>
              {shift.instructions ? shift.instructions.substring(0, 50) : ""}
              {shift.instructions && shift.instructions.length > 40 ? "..." : ""}
            </p>
          </div>
          <div className="button-container">
            <button
              className={`check-in-button ${buttonClass}`}
              disabled={disabled}
              onClick={() => onClick(shift)}
            >
              {icon && (
                <img
                  src={icon}
                  alt="Button Icon"
                  className="card-button-icon"
                />
              )}
              {label}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShiftCard;
