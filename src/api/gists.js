import axios from "axios";

export const SHARE_FILENAME = "share.json";
export const VERSION_FILENAME = "versionned.json";

const description = "drawDB diagram";
const baseUrl = import.meta.env.VITE_BACKEND_URL;

export const SHARE_BACKEND_NOT_CONFIGURED = "SHARE_BACKEND_NOT_CONFIGURED";
export const SHARE_BACKEND_REQUEST_FAILED = "SHARE_BACKEND_REQUEST_FAILED";
export const SHARE_BACKEND_INVALID_RESPONSE =
  "SHARE_BACKEND_INVALID_RESPONSE";

export function isApiError(result) {
  return result?.ok === false;
}

function apiError(reason, message) {
  return { ok: false, reason, message };
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Sharing backend request failed."
  );
}

function requireSharingBackendConfigured() {
  if (!baseUrl) {
    return apiError(
      SHARE_BACKEND_NOT_CONFIGURED,
      "Sharing backend is not configured.",
    );
  }
  return null;
}

function invalidResponseError() {
  return apiError(
    SHARE_BACKEND_INVALID_RESPONSE,
    "Sharing backend returned an invalid response.",
  );
}

export function isSharingBackendConfigured() {
  return Boolean(baseUrl);
}

export async function create(filename, content) {
  const configError = requireSharingBackendConfigured();
  if (configError) return configError;

  try {
    const res = await axios.post(`${baseUrl}/gists`, {
      public: false,
      filename,
      description,
      content,
    });

    const id = res?.data?.data?.id;
    if (!id) return invalidResponseError();

    return id;
  } catch (error) {
    return apiError(SHARE_BACKEND_REQUEST_FAILED, getErrorMessage(error));
  }
}

export async function patch(gistId, filename, content) {
  const configError = requireSharingBackendConfigured();
  if (configError) return configError;

  try {
    const { data } = await axios.patch(`${baseUrl}/gists/${gistId}`, {
      filename,
      content,
    });

    if (!data || typeof data.deleted === "undefined") {
      return invalidResponseError();
    }

    return data.deleted;
  } catch (error) {
    return apiError(SHARE_BACKEND_REQUEST_FAILED, getErrorMessage(error));
  }
}

export async function del(gistId) {
  const configError = requireSharingBackendConfigured();
  if (configError) return configError;

  try {
    await axios.delete(`${baseUrl}/gists/${gistId}`);
    return true;
  } catch (error) {
    return apiError(SHARE_BACKEND_REQUEST_FAILED, getErrorMessage(error));
  }
}

export async function get(gistId) {
  const configError = requireSharingBackendConfigured();
  if (configError) return configError;

  try {
    const res = await axios.get(`${baseUrl}/gists/${gistId}`);

    if (!res?.data?.data) return invalidResponseError();

    return res.data;
  } catch (error) {
    return apiError(SHARE_BACKEND_REQUEST_FAILED, getErrorMessage(error));
  }
}

export async function getCommits(gistId, perPage = 20, page = 1) {
  const configError = requireSharingBackendConfigured();
  if (configError) return configError;

  try {
    const res = await axios.get(`${baseUrl}/gists/${gistId}/commits`, {
      params: {
        per_page: perPage,
        page,
      },
    });

    if (!res?.data?.data) return invalidResponseError();

    return res.data;
  } catch (error) {
    return apiError(SHARE_BACKEND_REQUEST_FAILED, getErrorMessage(error));
  }
}

export async function getVersion(gistId, sha) {
  const configError = requireSharingBackendConfigured();
  if (configError) return configError;

  try {
    const res = await axios.get(`${baseUrl}/gists/${gistId}/${sha}`);

    if (!res?.data?.data) return invalidResponseError();

    return res.data;
  } catch (error) {
    return apiError(SHARE_BACKEND_REQUEST_FAILED, getErrorMessage(error));
  }
}

export async function getCommitsWithFile(
  gistId,
  file,
  limit = 10,
  cursor = null,
) {
  const configError = requireSharingBackendConfigured();
  if (configError) return configError;

  try {
    const res = await axios.get(
      `${baseUrl}/gists/${gistId}/file-versions/${file}`,
      {
        params: {
          limit,
          cursor,
        },
      },
    );

    if (!res?.data?.data || !res?.data?.pagination) {
      return invalidResponseError();
    }

    return res.data;
  } catch (error) {
    return apiError(SHARE_BACKEND_REQUEST_FAILED, getErrorMessage(error));
  }
}

export async function compare(gistId, file, versionA, versionB) {
  const configError = requireSharingBackendConfigured();
  if (configError) return configError;

  try {
    const res = await axios.get(
      `${baseUrl}/gists/${gistId}/file/${file}/compare/${versionA}/${versionB}`,
    );

    if (!res?.data?.data) return invalidResponseError();

    return res.data;
  } catch (error) {
    return apiError(SHARE_BACKEND_REQUEST_FAILED, getErrorMessage(error));
  }
}
