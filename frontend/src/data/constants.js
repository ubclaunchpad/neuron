export const backend = import.meta.env.PUBLIC_BACKEND_URL;

export const SHIFT_TYPES = {
    MY_SHIFTS: 'my-shifts',
    COVERAGE: 'coverage',
    MY_COVERAGE_REQUESTS: 'my-coverage-requests',
    DEFAULT: 'default',
};

export const ADMIN_SHIFT_TYPES = {
    ADMIN_NEEDS_COVERAGE: 'needs_coverage',
    ADMIN_REQUESTED_COVERAGE: 'requested_coverage',
    ADMIN_PENDING_FULFILL: 'pending_fulfill',
    ADMIN_COVERED: 'covered',
}

// For 'my-coverage-requests', it'll only be either OPEN or RESOLVED
export const COVERAGE_STATUSES = {
    RESOLVED: 'resolved',
    PENDING: 'pending',
    OPEN: 'open',
};

export const SHIFT_STATUS = {
    ASBENCE_PENDING: 'absence_pending',
    OPEN: 'open',
    COVERAGE_PENDING: 'coverage_pending',
    RESOLVED: 'resolved',
}

export const appColors = {};