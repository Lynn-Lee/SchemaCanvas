import { Banner, Button, Input, Spin, Toast } from "@douyinfe/semi-ui";
import { saveAs } from "file-saver";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { databases } from "../../data/databases";
import { createLocalDiagramRepository } from "../../persistence/localDiagramRepository";

function formatDate(value, language) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return `${date.toLocaleDateString(language)} ${date.toLocaleTimeString(
    language,
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  )}`;
}

function safeFileName(name) {
  return String(name || "diagram")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .trim();
}

function matchesSearch(diagram, query) {
  if (!query) return true;
  const normalizedQuery = query.toLowerCase();
  const databaseName = databases[diagram.database]?.name ?? diagram.database;

  return [diagram.name, diagram.diagramId, databaseName]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedQuery));
}

export default function LocalDiagramList({
  repository,
  selectedDiagramId,
  setSelectedDiagramId,
}) {
  const { t, i18n } = useTranslation();
  const localRepository = useMemo(
    () => repository ?? createLocalDiagramRepository(),
    [repository],
  );
  const [diagrams, setDiagrams] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDiagrams = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setDiagrams(await localRepository.listRecentDiagrams({ limit: 50 }));
    } catch (err) {
      setError(err?.message || "Failed to load local diagrams.");
    } finally {
      setLoading(false);
    }
  }, [localRepository]);

  useEffect(() => {
    loadDiagrams();
  }, [loadDiagrams]);

  const duplicateDiagram = async (diagram) => {
    try {
      await localRepository.duplicateDiagram(diagram.diagramId);
      await loadDiagrams();
      Toast.success(t("duplicate"));
    } catch {
      Toast.error(t("oops_smth_went_wrong"));
    }
  };

  const deleteDiagram = async (diagram) => {
    if (!window.confirm(t("are_you_sure_delete_diagram"))) return;

    try {
      await localRepository.deleteDiagram(diagram.diagramId);
      if (selectedDiagramId === diagram.diagramId) {
        setSelectedDiagramId("");
      }
      await loadDiagrams();
      Toast.success(t("delete"));
    } catch {
      Toast.error(t("oops_smth_went_wrong"));
    }
  };

  const exportDiagram = async (diagram) => {
    try {
      const fullDiagram = await localRepository.getDiagramById(diagram.diagramId);
      if (!fullDiagram) throw new Error("Diagram not found");
      const blob = new Blob([JSON.stringify(fullDiagram, null, 2)], {
        type: "application/json",
      });
      saveAs(blob, `${safeFileName(fullDiagram.name ?? diagram.name)}.json`);
      Toast.success(t("export"));
    } catch {
      Toast.error(t("oops_smth_went_wrong"));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spin />
      </div>
    );
  }

  if (error) {
    return (
      <Banner
        fullMode={false}
        type="danger"
        bordered
        icon={null}
        closeIcon={null}
        description={<div>{error}</div>}
      />
    );
  }

  if (diagrams.length === 0) {
    return (
      <Banner
        fullMode={false}
        type="info"
        bordered
        icon={null}
        closeIcon={null}
        description={<div>{t("no_saved_diagrams")}</div>}
      />
    );
  }

  const filteredDiagrams = diagrams.filter((diagram) =>
    matchesSearch(diagram, query),
  );

  return (
    <div className="space-y-3">
      <Input
        value={query}
        placeholder={t("search")}
        onChange={setQuery}
        prefix={<i className="bi bi-search opacity-60" />}
      />
      <div className="max-h-[360px] overflow-auto">
        <table className="w-full text-left border-separate border-spacing-x-0">
          <thead>
            <tr>
              <th>{t("name")}</th>
              <th>{t("database")}</th>
              <th>{t("tables")}</th>
              <th>{t("relationships")}</th>
              <th>{t("last_modified")}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredDiagrams.map((diagram) => {
              const databaseName =
                databases[diagram.database]?.name ?? diagram.database ?? "Generic";
              return (
                <tr
                  key={diagram.diagramId}
                  className={`cursor-pointer ${
                    selectedDiagramId === diagram.diagramId
                      ? "bg-blue-300/30"
                      : "hover-1"
                  }`}
                  onClick={() => setSelectedDiagramId(diagram.diagramId)}
                >
                  <td className="py-2">
                    <i className="bi bi-file-earmark-text text-[16px] me-1 opacity-60" />
                    {diagram.name}
                  </td>
                  <td className="py-2">{databaseName}</td>
                  <td className="py-2">{diagram.tableCount}</td>
                  <td className="py-2">{diagram.relationshipCount}</td>
                  <td className="py-2">
                    {formatDate(diagram.lastModified, i18n.language)}
                  </td>
                  <td
                    className="py-2 text-right whitespace-nowrap"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Button
                      size="small"
                      theme="borderless"
                      aria-label={`Copy ${diagram.name}`}
                      onClick={() => duplicateDiagram(diagram)}
                    >
                      <i className="bi bi-copy" /> {t("copy")}
                    </Button>
                    <Button
                      size="small"
                      theme="borderless"
                      aria-label={`Export ${diagram.name}`}
                      onClick={() => exportDiagram(diagram)}
                    >
                      <i className="bi bi-download" /> {t("export")}
                    </Button>
                    <Button
                      size="small"
                      theme="borderless"
                      type="danger"
                      aria-label={`Delete ${diagram.name}`}
                      onClick={() => deleteDiagram(diagram)}
                    >
                      <i className="bi bi-trash" /> {t("delete")}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
