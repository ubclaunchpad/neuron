import type { auth } from "@/lib/auth";

type ErrorCode = keyof typeof auth.$ERROR_CODES | (string & {});

type ErrorMessages = { [K in ErrorCode]: string };

const errorMessages: ErrorMessages = {
    USER_NOT_FOUND: "We couldn't find your account. Please check your credentials and try again.",
    FAILED_TO_CREATE_USER: "We encountered an issue while creating your account. Please try again later.",
    FAILED_TO_CREATE_SESSION: "Unable to start your session. Please try signing in again.",
    FAILED_TO_UPDATE_USER: "We couldn't update your account information. Please try again later.",
    FAILED_TO_GET_SESSION: "Your session information couldn't be retrieved. Please sign in again.",
    INVALID_PASSWORD: "The password you entered is incorrect. Please try again.",
    INVALID_EMAIL: "Please enter a valid email address.",
    INVALID_EMAIL_OR_PASSWORD: "The email or password you entered is incorrect. Please try again.",
    SOCIAL_ACCOUNT_ALREADY_LINKED: "This social account is already connected to another user.",
    PROVIDER_NOT_FOUND: "This login method is currently unavailable. Please try another option.",
    INVALID_TOKEN: "Your authentication token is invalid. Please sign in again.",
    ID_TOKEN_NOT_SUPPORTED: "This type of authentication is not supported.",
    FAILED_TO_GET_USER_INFO: "We couldn't retrieve your account information. Please try again later.",
    USER_EMAIL_NOT_FOUND: "We couldn't find an account with this email address.",
    EMAIL_NOT_VERIFIED: "Please verify your email address before continuing.",
    PASSWORD_TOO_SHORT: "Your password is too short. Please use at least 8 characters.",
    PASSWORD_TOO_LONG: "Your password is too long. Please use fewer characters.",
    USER_ALREADY_EXISTS: "An account with this email already exists. Please sign in instead.",
    EMAIL_CAN_NOT_BE_UPDATED: "This email address cannot be updated. Please contact support if you need help.",
    CREDENTIAL_ACCOUNT_NOT_FOUND: "We couldn't find your login credentials. Please try signing in again.",
    SESSION_EXPIRED: "Your session has expired. Please sign in again to continue.",
    FAILED_TO_UNLINK_LAST_ACCOUNT: "You cannot remove your last login method. Please add another before trying again.",
    ACCOUNT_NOT_FOUND: "We couldn't find your account. Please check your information and try again.",
    USER_ALREADY_HAS_PASSWORD: "A password has already been set for this account.",
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "An account with this email already exists. Please use a different email address."
};

export function getBetterAuthErrorMessage(code: ErrorCode): string {
    return errorMessages[code] ?? 'An unexpected error occurred. Please try again later.';
}
