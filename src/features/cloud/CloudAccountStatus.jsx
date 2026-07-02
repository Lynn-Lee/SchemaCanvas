import { useTranslation } from "react-i18next";

const STATUS_COPY = {
  unavailable: {
    title: "cloud_status_unavailable",
    description: "cloud_status_unavailable_description",
  },
  "signed-out": {
    title: "cloud_status_signed_out",
    description: "cloud_status_signed_out_description",
  },
  "signed-in": {
    title: "cloud_status_signed_in",
    description: "cloud_status_signed_in_description",
  },
  "expired-session": {
    title: "cloud_status_expired_session",
    description: "cloud_status_expired_session_description",
  },
};

const ACTION_BUTTON_BASE =
  "rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
const PRIMARY_ACTION_BUTTON = `${ACTION_BUTTON_BASE} bg-slate-900 text-white hover:bg-slate-700 focus:ring-slate-500`;
const TERTIARY_ACTION_BUTTON = `${ACTION_BUTTON_BASE} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-400`;

function getStatusCopy(status) {
  return STATUS_COPY[status] ?? STATUS_COPY.unavailable;
}

export default function CloudAccountStatus({
  status = "unavailable",
  account,
  onSignIn,
  onSignOut,
}) {
  const { t } = useTranslation();
  const copy = getStatusCopy(status);
  const canSignIn = status === "signed-out" || status === "expired-session";
  const canSignOut = status === "signed-in";
  const displayName = account?.name || account?.email || null;

  return (
    <section className="space-y-4" aria-labelledby="cloud-account-status-title">
      <div className="space-y-1">
        <h2
          id="cloud-account-status-title"
          className="text-lg font-semibold text-slate-900"
        >
          {t(copy.title)}
        </h2>
        <p className="text-sm leading-6 text-slate-600">
          {t(copy.description)}
        </p>
      </div>

      {status === "signed-in" && displayName ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <div className="font-medium text-slate-900">{displayName}</div>
          {account?.email && account.email !== displayName ? (
            <div>{account.email}</div>
          ) : null}
        </div>
      ) : null}

      {status === "expired-session" ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {t("cloud_status_local_changes_preserved")}
        </p>
      ) : null}

      <p className="text-sm leading-6 text-slate-600">
        {t("cloud_status_local_mode_available")}
      </p>

      <div className="flex flex-wrap gap-2">
        {canSignIn ? (
          <button
            type="button"
            className={PRIMARY_ACTION_BUTTON}
            onClick={onSignIn}
          >
            {t("cloud_action_sign_in")}
          </button>
        ) : null}
        {canSignOut ? (
          <button
            type="button"
            className={TERTIARY_ACTION_BUTTON}
            onClick={onSignOut}
          >
            {t("cloud_action_sign_out")}
          </button>
        ) : null}
      </div>
    </section>
  );
}
