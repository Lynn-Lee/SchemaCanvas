import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { noBackendCloudRepository } from "../persistence/cloudRepository";

const ALL_FILTER = "all";
const MINE_FILTER = "mine";

function normalizeListResult(result, key) {
  if (!result?.ok) {
    return {
      ok: false,
      reason: result?.reason ?? "error",
      message: result?.message,
    };
  }

  return {
    ok: true,
    items: Array.isArray(result[key]) ? result[key] : [],
  };
}

function formatModifiedAt(value) {
  if (!value) {
    return "cloud_diagrams_modified_unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "cloud_diagrams_modified_unknown";
  }

  return date.toISOString().slice(0, 16).replace("T", " ");
}

function getDiagramName(diagram) {
  return diagram.name || diagram.title || "cloud_diagrams_untitled";
}

function getTableCount(diagram) {
  if (Number.isFinite(diagram.tableCount)) {
    return diagram.tableCount;
  }

  if (Array.isArray(diagram.tables)) {
    return diagram.tables.length;
  }

  return 0;
}

function filterDiagrams(diagrams, filter) {
  if (filter === MINE_FILTER) {
    return diagrams.filter((diagram) => !diagram.teamId);
  }

  if (filter.startsWith("team:")) {
    const teamId = filter.slice("team:".length);
    return diagrams.filter((diagram) => diagram.teamId === teamId);
  }

  return diagrams;
}

export default function CloudDiagrams({
  repository = noBackendCloudRepository,
}) {
  const { t } = useTranslation();
  const [state, setState] = useState({
    loading: true,
    error: null,
    diagrams: [],
    teams: [],
  });
  const [filter, setFilter] = useState(ALL_FILTER);

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: null }));

    Promise.all([
      repository.listCloudDiagrams(),
      repository.listTeams(),
    ])
      .then(([diagramsResult, teamsResult]) => {
        if (!active) {
          return;
        }

        const diagrams = normalizeListResult(diagramsResult, "diagrams");
        if (!diagrams.ok) {
          setState({
            loading: false,
            error: diagrams,
            diagrams: [],
            teams: [],
          });
          return;
        }

        const teams = normalizeListResult(teamsResult, "teams");
        setState({
          loading: false,
          error: teams.ok ? null : teams,
          diagrams: diagrams.items,
          teams: teams.ok ? teams.items : [],
        });
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        setState({
          loading: false,
          error: {
            reason: "error",
            message: error?.message,
          },
          diagrams: [],
          teams: [],
        });
      });

    return () => {
      active = false;
    };
  }, [repository]);

  useEffect(() => {
    document.title = "Cloud diagrams | drawDB";
  }, []);

  const filteredDiagrams = useMemo(
    () => filterDiagrams(state.diagrams, filter),
    [filter, state.diagrams],
  );

  const isUnavailable = state.error?.reason === "unavailable";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <Link className="text-sm font-semibold text-slate-700" to="/">
              drawDB
            </Link>
            <h1 className="text-2xl font-semibold">{t("cloud_diagrams")}</h1>
          </div>
          <Link
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            to="/editor"
          >
            {t("cloud_diagrams_open_editor")}
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-8">
        {state.loading ? (
          <div
            className="rounded-md border border-slate-200 bg-white p-6"
            role="status"
          >
            {t("cloud_diagrams_loading")}
          </div>
        ) : null}

        {!state.loading && isUnavailable ? (
          <CloudMessage
            title={t("cloud_diagrams_unavailable")}
            description={t("cloud_diagrams_unavailable_description")}
            extra={t("cloud_diagrams_local_mode_available")}
          />
        ) : null}

        {!state.loading && state.error && !isUnavailable ? (
          <CloudMessage
            title={t("cloud_diagrams_error")}
            description={state.error.message || t("cloud_diagrams_error_body")}
            extra={t("cloud_diagrams_local_mode_available")}
          />
        ) : null}

        {!state.loading && !state.error ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  {t("cloud_diagrams_library")}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {t("cloud_diagrams_library_description")}
                </p>
              </div>

              <label className="grid gap-1 text-sm font-medium text-slate-700">
                {t("cloud_diagrams_team_filter")}
                <select
                  className="min-w-48 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                >
                  <option value={ALL_FILTER}>{t("cloud_diagrams_all")}</option>
                  <option value={MINE_FILTER}>{t("cloud_diagrams_mine")}</option>
                  {state.teams.map((team) => (
                    <option key={team.id} value={`team:${team.id}`}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {filteredDiagrams.length === 0 ? (
              <CloudMessage
                title={t("cloud_diagrams_empty")}
                description={t("cloud_diagrams_empty_description")}
              />
            ) : (
              <div className="grid gap-3">
                {filteredDiagrams.map((diagram) => (
                  <article
                    key={diagram.id}
                    className="rounded-md border border-slate-200 bg-white p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {getDiagramName(diagram)}
                        </h3>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                          <span>
                            {diagram.database || t("cloud_diagrams_database_unknown")}
                          </span>
                          <span>{getTableCount(diagram)} tables</span>
                          <span>{formatModifiedAt(diagram.modifiedAt)}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                          {diagram.permission || "viewer"}
                        </span>
                        <Link
                          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                          to={`/editor?cloudDiagramId=${encodeURIComponent(
                            diagram.id,
                          )}`}
                        >
                          {t("cloud_diagrams_open_cloud_diagram")}
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function CloudMessage({ title, description, extra }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      {extra ? (
        <p className="mt-3 text-sm leading-6 text-slate-600">{extra}</p>
      ) : null}
    </section>
  );
}
