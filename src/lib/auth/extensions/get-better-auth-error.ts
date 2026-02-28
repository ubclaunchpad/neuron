import type { auth } from "@/lib/auth";

export type ErrorCode = keyof typeof auth.$ERROR_CODES | (string & {});

type ErrorMessages = Record<ErrorCode, string>;

const errorMessages: ErrorMessages = {
  USER_NOT_FOUND:
    "We couldn't find your account. Please check your credentials and try again.",
  FAILED_TO_CREATE_USER:
    "We encountered an issue while creating your account. Please try again later.",
  FAILED_TO_CREATE_SESSION:
    "Unable to start your session. Please try signing in again.",
  FAILED_TO_UPDATE_USER:
    "We couldn't update your account information. Please try again later.",
  FAILED_TO_GET_SESSION:
    "Your session information couldn't be retrieved. Please sign in again.",
  INVALID_PASSWORD: "The password you entered is incorrect. Please try again.",
  INVALID_EMAIL: "Please enter a valid email address.",
  INVALID_EMAIL_OR_PASSWORD:
    "The email or password you entered is incorrect. Please try again.",
  SOCIAL_ACCOUNT_ALREADY_LINKED:
    "This social account is already connected to another user.",
  PROVIDER_NOT_FOUND:
    "This login method is currently unavailable. Please try another option.",
  INVALID_TOKEN: "Your authentication token is invalid. Please sign in again.",
  ID_TOKEN_NOT_SUPPORTED: "This type of authentication is not supported.",
  FAILED_TO_GET_USER_INFO:
    "We couldn't retrieve your account information. Please try again later.",
  USER_EMAIL_NOT_FOUND: "We couldn't find an account with this email address.",
  EMAIL_NOT_VERIFIED: "Please verify your email address before continuing.",
  PASSWORD_TOO_SHORT:
    "Your password is too short. Please use at least 8 characters.",
  PASSWORD_TOO_LONG: "Your password is too long. Please use fewer characters.",
  USER_ALREADY_EXISTS:
    "An account with this email already exists. Please sign in instead.",
  EMAIL_CAN_NOT_BE_UPDATED:
    "This email address cannot be updated. Please contact support if you need help.",
  CREDENTIAL_ACCOUNT_NOT_FOUND:
    "We couldn't find your login credentials. Please try signing in again.",
  SESSION_EXPIRED:
    "Your session has expired. Please sign in again to continue.",
  FAILED_TO_UNLINK_LAST_ACCOUNT:
    "You cannot remove your last login method. Please add another before trying again.",
  ACCOUNT_NOT_FOUND:
    "We couldn't find your account. Please check your information and try again.",
  USER_ALREADY_HAS_PASSWORD:
    "A password has already been set for this account.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    "An account with this email already exists. Please use a different email address.",
  CROSS_SITE_NAVIGATION_LOGIN_BLOCKED:
    "This request was blocked for security reasons. Please try again from the original page.",
  VERIFICATION_EMAIL_NOT_ENABLED:
    "Email verification is not currently enabled. Please contact support.",
  EMAIL_ALREADY_VERIFIED: "Your email address has already been verified.",
  EMAIL_MISMATCH:
    "The email address does not match. Please check and try again.",
  SESSION_NOT_FRESH:
    "Your session needs to be refreshed. Please sign in again to continue.",
  LINKED_ACCOUNT_ALREADY_EXISTS:
    "This account is already linked. Please use a different account.",
  INVALID_ORIGIN:
    "The request origin is not allowed. Please try again from the correct page.",
  INVALID_CALLBACK_URL: "The callback URL provided is invalid.",
  INVALID_REDIRECT_URL: "The redirect URL provided is invalid.",
  INVALID_ERROR_CALLBACK_URL: "The error callback URL provided is invalid.",
  INVALID_NEW_USER_CALLBACK_URL:
    "The new user callback URL provided is invalid.",
  MISSING_OR_NULL_ORIGIN:
    "The request is missing a valid origin. Please try again.",
  CALLBACK_URL_REQUIRED: "A callback URL is required to proceed.",
  FAILED_TO_CREATE_VERIFICATION:
    "We couldn't create the verification. Please try again later.",
  FIELD_NOT_ALLOWED: "This field is not allowed to be set.",
  ASYNC_VALIDATION_NOT_SUPPORTED: "Async validation is not supported.",
  VALIDATION_ERROR:
    "There was a validation error. Please check your input and try again.",
  MISSING_FIELD: "A required field is missing. Please fill in all fields.",
  APP_INVITATION_NOT_FOUND:
    "This invitation is invalid or expired. Please request a new invitation.",
  USER_WAS_ALREADY_INVITED_TO_THIS_APPLICATION:
    "This email already has an active invitation.",
  USER_IS_ALREADY_A_MEMBER_OF_THIS_APPLICATION:
    "This user is already a member of the application.",
  YOU_ARE_NOT_ALLOWED_TO_INVITE_USERS_TO_THIS_APPLICATION:
    "You are not allowed to invite users.",
  INVITER_IS_NO_LONGER_A_MEMBER_OF_THIS_APPLICATION:
    "The inviter is no longer active. Please request a new invitation.",
  YOU_ARE_NOT_ALLOWED_TO_CANCEL_THIS_APP_INVITATION:
    "You are not allowed to cancel this invitation.",
  THIS_APP_INVITATION_CANT_BE_REJECTED:
    "This invitation can no longer be rejected.",
  EMAIL_DOMAIN_IS_NOT_IN_WHITELIST:
    "This email domain is not allowed for this invitation.",
  ADMIN_PLUGIN_IS_NOT_SET_UP:
    "Invitation permissions are not configured correctly. Please contact support.",
};

export function getBetterAuthErrorMessage(code: ErrorCode | undefined): string {
  const message = code ? errorMessages[code] : undefined;
  return message ?? "An unexpected error occurred. Please try again later.";
}
