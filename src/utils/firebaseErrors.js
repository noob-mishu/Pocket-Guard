const ERROR_MESSAGES = {
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/user-not-found": "No account found with this email address.",
  "auth/weak-password": "Password should be at least 6 characters.",
  "auth/invalid-email": "The email address is invalid.",
  "auth/popup-closed-by-user": "Sign-in window was closed before completing.",
  "auth/popup-blocked": "Sign-in window was blocked by the browser.",
  "auth/cancelled-popup-request": "The sign-in request was cancelled.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/network-request-failed": "A network error occurred. Check your connection and try again.",
};

export function getFirebaseErrorMessage(error) {
  if (error && error.code && ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code];
  }
  return (error && error.message) || "Something went wrong. Please try again.";
}