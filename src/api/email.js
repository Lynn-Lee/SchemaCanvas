import axios from "axios";
import i18n from "../i18n/i18n";

export const EMAIL_BACKEND_NOT_CONFIGURED = "EMAIL_BACKEND_NOT_CONFIGURED";
export const EMAIL_BACKEND_REQUEST_FAILED = "EMAIL_BACKEND_REQUEST_FAILED";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

function apiError(reason, message) {
  return { ok: false, reason, message };
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    i18n.t("email_backend_request_failed")
  );
}

export async function send(subject, message, attachments) {
  if (!baseUrl) {
    return apiError(
      EMAIL_BACKEND_NOT_CONFIGURED,
      i18n.t("email_backend_not_configured"),
    );
  }

  try {
    return await axios.post(`${baseUrl}/email/send`, {
      subject,
      message,
      attachments,
    });
  } catch (error) {
    return apiError(EMAIL_BACKEND_REQUEST_FAILED, getErrorMessage(error));
  }
}
