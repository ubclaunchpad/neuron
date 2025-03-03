import dayjs from 'dayjs';
import { COVERAGE_STATUSES, SHIFT_TYPES, ADMIN_SHIFT_TYPES } from '../data/constants';
import { requestToCoverShift, requestShiftCoverage, cancelCoverShift, cancelCoverRequest, checkInShift } from '../api/shiftService';
import CheckInIcon from '../assets/images/button-icons/clock-icon.svg';
import PlusIcon from '../assets/images/button-icons/plus-icon.svg';
import RequestCoverageIcon from '../assets/request-coverage.png'
import CancelIcon from "../assets/images/button-icons/x-icon.svg";
import ViewRequestIcon from "../assets/images/button-icons/clipboard.png"

const handleCheckInClick = async (shift, handleShiftUpdate) => {
    try {
        if (!shift.checked_in) {
            // console.log(`Checking in for shift ${shift.shift_id}`);
            await checkInShift(shift.shift_id);
            handleShiftUpdate({ ...shift, checked_in: 1 });
        } 

    } catch (error) {
        console.error('Error checking in for shift:', error);
    }
};

const handleCoverShiftClick = async (shift, handleShiftUpdate, volunteerID) => {
    try {
        const body = {
            request_id: shift.request_id,
            volunteer_id: volunteerID,
        };
        // console.log(`Requesting to cover shift ${shift.shift_id}`);
        await requestToCoverShift(body);
        handleShiftUpdate({ ...shift, coverage_status: COVERAGE_STATUSES.PENDING });

    } catch (error) {
        console.error('Error generating request to cover shift:', error);
    }
};

const handleRequestCoverageClick = async (shift, handleShiftUpdate) => {
    try {
        const body = {
            shift_id: shift.shift_id,
        }
        // console.log(`Requesting coverage for shift ${shift.shift_id}`);
        let data = await requestShiftCoverage(body);
        handleShiftUpdate({ ...shift, shift_type: SHIFT_TYPES.MY_COVERAGE_REQUESTS, coverage_status: COVERAGE_STATUSES.OPEN, request_id: data.insertId });
         
    } catch (error) {
        console.error('Error requesting for shift coverage: ', error);
    }
};

const handleCancelClick = async (shift, handleShiftUpdate, volunteerID) => {

    if (shift.shift_type === SHIFT_TYPES.COVERAGE) {

        try {
            // console.log("Canceling coverage for shift ID: ", shift.shift_id);
            const body = {
                request_id: shift.request_id,
                volunteer_id: volunteerID
            };
            await cancelCoverShift(body);
            handleShiftUpdate({ ...shift, coverage_status: COVERAGE_STATUSES.OPEN });

        } catch (error) {
            console.error('Error canceling coverage:', error);
        }
    
    } else if (shift.shift_type === SHIFT_TYPES.MY_COVERAGE_REQUESTS) {

        try {
            // console.log("Canceling coverage request for shift ID: ", shift.shift_id);
            const body = {
                request_id: shift.request_id,
                shift_id: shift.shift_id,
            };
            await cancelCoverRequest(body);
            handleShiftUpdate({ ...shift, shift_type: SHIFT_TYPES.MY_SHIFTS, coverage_status: null, request_id: null });

        } catch (error) {
            console.error('Error canceling coverage request:', error);
        }
    }
}

// Returns the button configuration for the shift based on the shift type
export const getButtonConfig = (shift, handleShiftUpdate, volunteerID = null) => {

    const shiftDay = dayjs(shift.shift_date).format('YYYY-MM-DD');
    const shiftStart = dayjs(`${shiftDay} ${shift.start_time}`);
    const shiftEnd = dayjs(`${shiftDay} ${shift.end_time}`);
    const currentDate = dayjs();
    
    // Accounts for a 30 minute window before and after the shift
    const pastShift = currentDate.isAfter(shiftEnd.add(30, 'minutes'));
    const currentShift = currentDate.isBetween(
        shiftStart.subtract(30, 'minutes'),
        shiftEnd.add(30, 'minutes'),
        'minute',
        '[]'
    );

    return {
        [SHIFT_TYPES.MY_SHIFTS]: {
            lineColor: 'var(--green)',  // Line color for the shift card
            label: shift.checked_in 
                ? 'Checked In' 
                    : currentShift 
                    ? 'Check In' 
                        : pastShift
                        ? 'Missed Shift'
                            : 'Upcoming',
            icon: shift.checked_in ? null : currentShift ? CheckInIcon : null,
            iconColourClass: shift.checked_in ? null : currentShift ? 'icon-white' : null, // Icon colour classes defined in styles.css
            disabled: shift.checked_in || !currentShift || pastShift,
            buttonClass: shift.checked_in ? 'checked-in' : currentShift ? 'primary-action' : '',
            onClick: () => handleCheckInClick(shift, handleShiftUpdate),
        },
        [SHIFT_TYPES.COVERAGE]: {
            lineColor: 'var(--red)',
            label: shift.coverage_status === COVERAGE_STATUSES.PENDING
                ? 'Pending Approval'
                : 'Cover',
            icon: shift.coverage_status === COVERAGE_STATUSES.OPEN ? PlusIcon : null,
            iconColourClass: shift.coverage_status === COVERAGE_STATUSES.OPEN ? 'icon-white' : null,
            disabled: shift.coverage_status === COVERAGE_STATUSES.PENDING,
            buttonClass: shift.coverage_status === COVERAGE_STATUSES.OPEN ? 'primary-action' : '',
            onClick: () => handleCoverShiftClick(shift, handleShiftUpdate, volunteerID),
        },
        [SHIFT_TYPES.MY_COVERAGE_REQUESTS]: {
            lineColor: 'var(--yellow)',
            label: shift.coverage_status === COVERAGE_STATUSES.OPEN
                ? 'Requested Coverage'
                : 'Shift Filled',
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
            onClick: () => handleRequestCoverageClick(shift, handleShiftUpdate),
        },
        CANCEL: {
            label: 'Cancel',
            icon: CancelIcon,
            iconColourClass: 'icon-white',
            disabled: false,
            buttonClass: 'cancel-action',
            onClick: () => handleCancelClick(shift, handleShiftUpdate, volunteerID),
        },
        [ADMIN_SHIFT_TYPES.ADMIN_NEEDS_COVERAGE]: {
            lineColor: "var(--red)",
            label: "Needs Coverage",
            icon: null,
            disabled: false,
            buttonClass: "needs-coverage-button",
            onClick: () => {},
          },
          [ADMIN_SHIFT_TYPES.ADMIN_REQUESTED_COVERAGE]: {
            lineColor: "var(--yellow)",
            label: "View Request",
            icon: ViewRequestIcon,
            disabled: false,
            buttonClass: "requested-coverage-button",
            onClick: () => {},
          },
          [ADMIN_SHIFT_TYPES.ADMIN_PENDING_FULFILL]: {
            lineColor: "var(--primary-blue)",
            label: "Pending Fulfill",
            icon: null,
            disabled: false,
            buttonClass: "pending-fulfill-button",
            onClick: () => {},
          },
          [ADMIN_SHIFT_TYPES.ADMIN_COVERED]: {
            lineColor: "var(--grey)",
            label: "View Details",
            icon: null,
            disabled: false,
          }
    };
}