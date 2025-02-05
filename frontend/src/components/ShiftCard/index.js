import dayjs from 'dayjs';
import { requestToCoverShift } from '../../api/shiftService';
import CheckInIcon from '../../assets/check-in-icon.png';
import Plus from '../../assets/plus.png';
import RequestCoverageIcon from '../../assets/request-coverage.png';
import { useAuth } from '../../contexts/authContext';
import { COVERAGE_STATUSES, SHIFT_TYPES } from '../../data/constants';
import './index.css';

function ShiftCard({ shift, shiftType, onUpdate, onShiftSelect }) {
    const currentDate = dayjs();
    const shiftDay = dayjs(shift.shift_date).format('YYYY-MM-DD');
    const shiftStart = dayjs(`${shiftDay} ${shift.start_time}`);
    const shiftEnd = dayjs(`${shiftDay} ${shift.end_time}`);

    const pastShift = currentDate.isAfter(shiftEnd);
    const currentShift = currentDate.isBetween(shiftStart, shiftEnd, 'minute', '[]');

    const { user } = useAuth();

    const handleCoverShiftClick = async () => {
        try {
            const body = {
                request_id: shift.request_id,
                volunteer_id: user.volunteer.volunteer_id,
            };
            await requestToCoverShift(body);
            // notify parent
            onUpdate();
        } catch (error) {
            console.error('Error generating request to cover shift:', error);
        }
    };

    // TODO Check-in handler for 'my-shifts'
    const handleCheckInClick = async () => {
        if (!shift.checked_in && currentShift) {
            // Perform check-in logic here
            console.log(`Checking in for shift ${shift.shift_id}`);
            // Set the state or make API call here to mark the shift as checked in
        }
    };

    // TODO
    const handleRequestCoverageClick = () => {
        console.log(`Requesting coverage for shift ${shift.shift_id}`);
        // Add logic for requesting coverage
    };

    const buttonConfig = {
        [SHIFT_TYPES.MY_SHIFTS]: {
            lineColor: 'var(--green)',
            label: shift.checked_in 
                ? 'Checked In' 
                    : currentShift 
                    ? 'Check In' 
                        : pastShift
                        ? 'Missed Shift'
                            : 'Upcoming',
            icon: shift.checked_in ? null : currentShift ? CheckInIcon : null,
            disabled: shift.checked_in || !currentShift,
            buttonClass: shift.checked_in ? 'checked-in' : '',
            onClick: handleCheckInClick,
        },
        [SHIFT_TYPES.COVERAGE]: {
            lineColor: 'var(--red)',
            label: shift.coverage_status === COVERAGE_STATUSES.RESOLVED
                ? 'Resolved'
                : shift.coverage_status === COVERAGE_STATUSES.PENDING
                ? 'Pending Approval'
                : 'Cover',
            icon: shift.coverage_status === COVERAGE_STATUSES.OPEN ? Plus : null,
            disabled: shift.coverage_status === COVERAGE_STATUSES.RESOLVED || shift.coverage_status === COVERAGE_STATUSES.PENDING,
            onClick: handleCoverShiftClick,
        },
        [SHIFT_TYPES.MY_COVERAGE_REQUESTS]: {
            lineColor: 'var(--yellow)',
            label: 'Requested Coverage',
            icon: null,
            disabled: true,
            onClick: () => {}, // No action for this state
        },
        [SHIFT_TYPES.DEFAULT]: {
            lineColor: 'var(--grey)',
            label: 'View Details',
            icon: null,
            disabled: false,
        },
        REQUEST_COVERAGE: {
            lineColor: 'var(--yellow)',
            label: 'Request Coverage',
            icon: RequestCoverageIcon,
            disabled: false,
            onClick: handleRequestCoverageClick,
        },
    };

    const generateButtonsForDetailsPanel = () => {
        const buttons = [];
        const primaryButton = buttonConfig[shiftType] || buttonConfig[SHIFT_TYPES.DEFAULT];

        buttons.push(primaryButton);
        if (shiftType === SHIFT_TYPES.MY_SHIFTS && !shift.checked_in && !pastShift) {
            buttons.push(buttonConfig.REQUEST_COVERAGE);
        }
        return buttons;
    };

    const handleShiftSelection = () => {
        const buttons = generateButtonsForDetailsPanel();
        onShiftSelect({ ...shift, buttons });
    };

    const { lineColor, label, icon, disabled, buttonClass, onClick } =
        buttonConfig[shiftType] || buttonConfig[SHIFT_TYPES.DEFAULT];

    return (
        <div className="shift-card" onClick={handleShiftSelection}>
            <div className="vertical-line" style={{ backgroundColor: lineColor }} />
            <div className="card-content">
                <div className="column segment-1">
                    <div className="card-text">
                        <h2 className="shift-time">{shift.start_time}</h2>
                        <p>{shift.duration} hour</p>
                    </div>
                </div>
                <div className="column segment-2">
                    <div className="card-text">
                        <h2>{shift.class_name}</h2>
                        <p>{shift.instructions.substring(0, 50)}{shift.instructions.length > 40 ? '...' : ''}</p>
                    </div>
                    <div className="button-container">
                        <button
                            className={`check-in-button ${buttonClass}`}
                            disabled={disabled}
                            onClick={onClick}
                        >
                            {icon && <img src={icon} alt="Button Icon" className="card-button-icon" />}
                            {label}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ShiftCard;