export const backend = process.env.REACT_APP_BACKEND;

export const SHIFT_TYPES = {
    MY_SHIFTS: 'my-shifts',
    COVERAGE: 'coverage',
    MY_COVERAGE_REQUESTS: 'my-coverage-requests',
    DEFAULT: 'default',
};

// For 'my-coverage-requests', it'll only be either OPEN or RESOLVED
export const COVERAGE_STATUSES = {
    RESOLVED: 'resolved',
    PENDING: 'pending',
    OPEN: 'open',
};

export const appColors = {};