import "./index.css";
import { SHIFT_TYPES, COVERAGE_STATUSES } from "../../data/constants";
import dayjs from "dayjs";

function CoverageRequestCard({
  shift,
  shiftType,
  onShiftSelect,
  buttonConfig,
}) {
  const handleShiftSelection = () => {
    onShiftSelect(shift);
  };

  const approved =
    shift.absence_request.status === "coverage-pending"
      ? "available"
      : "approved";

  const { lineColor, label, icon, disabled, buttonClass, onClick } =
    buttonConfig?.[approved] ||
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
    <div className="coverage-card" onClick={handleShiftSelection}>
      <div
        className="coverage-vertical-line"
        style={{ backgroundColor: lineColor }}
      />
      <div className="coverage-card-content">
        <div className="column coverage-segment-1">
          <div className="coverage-card-text">
            <h2 className="shift-time">{shift.start_time}</h2>
            <p>{parseShiftDuration(shift.duration)}</p>
          </div>
        </div>
        <div className="column coverage-segment-2">
          <div className="coverage-card-text coverage-card-text">
            <h2>
              {shift.class_name.substring(0, 30)}
              {shift.class_name.length > 25 ? "..." : ""}
            </h2>
            <p>
              Instructor: {shift.instructor_f_name} {shift.instructor_l_name}{" "}
            </p>
            <p>
              Volunteer(s): {shift.volunteer_f_name} {shift.volunteer_l_name}{" "}
            </p>
          </div>
        </div>
        <div className="column coverage-segment-3">
          <div className="coverage-card-text coverage-card-text">
            <h2>
              Requested By: {shift.volunteer_f_name} {shift.volunteer_l_name}
            coverage-</h2>
            <p>Requested For: This Session Only</p>
            <p>Requested On: {dayjs().format("YYYY-MM-DD").toString()}</p>
          </div>
          <div className="coverage-button-container">
            <button
              className={`coverage-button ${buttonClass}`}
              disabled={disabled}
              onClick={() => onClick(shift)}
            >
              {icon && (
                <img
                  src={icon}
                  alt="Button Icon"
                  className="coverage-card-button-icon"
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

export default CoverageRequestCard;
