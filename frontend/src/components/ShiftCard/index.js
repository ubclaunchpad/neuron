import dayjs from 'dayjs';
import CheckInIcon from '../../assets/check-in-icon.png'
import Plus from '../../assets/plus.png'
import './index.css'; 
import { requestToCoverShift } from '../../api/shiftService';
import { SHIFT_TYPES, COVERAGE_STATUSES } from '../../data/constants';

function ShiftCard({ shift, shiftType, onUpdate, onShiftSelect }) {
    const currentDate = dayjs();
    const pastShift = dayjs(shift.shift_date).format('YYYY-MM-DD') <= currentDate.format('YYYY-MM-DD');
    const volunteerID = localStorage.getItem('volunteerID');

    const handleCoverShiftClick = async () => {
        try {
            const body = {
                request_id: shift.request_id,
                volunteer_id: volunteerID,
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
        if (!shift.checked_in && pastShift) {
            // Perform check-in logic here
            console.log(`Checking in for shift ${shift.shift_id}`);
            // Set the state or make API call here to mark the shift as checked in
        }
    };

    // TODO View details handler for the default button
    const handleViewDetailsClick = () => {
        console.log(`Viewing details for shift ${shift.shift_id}`);
    };

    const buttonConfig = {
        [SHIFT_TYPES.MY_SHIFTS]: {
            lineColor: 'var(--green)',
            label: shift.checked_in ? 'Checked In' : pastShift ? 'Check In' : 'Upcoming',
            icon: shift.checked_in ? null : pastShift ? CheckInIcon : null,
            disabled: shift.checked_in || !pastShift,
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
            onClick: () => {},  // No action for this state
        },
        [SHIFT_TYPES.DEFAULT]: {
            lineColor: 'var(--grey)',
            label: 'View Details',
            icon: null,
            disabled: false,
            onClick: handleViewDetailsClick,
        },
    };

    const { lineColor, label, icon, disabled, buttonClass, onClick } =
        buttonConfig[shiftType] || buttonConfig.default;

    return (
        <div className="shift-card" onClick={() => onShiftSelect(shift)}>
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