import { Image, Input, Modal as SemiUIModal, Spin } from "@douyinfe/semi-ui";
import { saveAs } from "file-saver";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DB, MODAL, STATUS } from "../../../data/constants";
import { databases } from "../../../data/databases";
import {
  useAreas,
  useDiagram,
  useEnums,
  useNavigateWithParams,
  useNotes,
  useSettings,
  useTransform,
  useTypes,
  useUndoRedo,
} from "../../../hooks";
import { isRtl } from "../../../i18n/utils/rtl";
import {
  getModalTitle,
  getModalWidth,
  getOkText,
} from "../../../utils/modalData";
import CodeEditor from "../../CodeEditor";
import ImportDiagram from "./ImportDiagram";
import ImportSource from "./ImportSource";
import Language from "./Language";
import New from "./New";
import Open from "./Open";
import Rename from "./Rename";
import SetTableWidth from "./SetTableWidth";
import Share from "./Share";
import { mergeCustomTypes } from "../../../utils/customTypes";
import {
  IMPORT_MODE,
  applyImportMode,
} from "../../../features/import/applyImportMode";

const extensionToLanguage = {
  md: "markdown",
  sql: "sql",
  dbml: "dbml",
  json: "json",
};

export default function Modal({
  modal,
  setModal,
  title,
  setTitle,
  exportData,
  setExportData,
  importDb,
  importFrom,
}) {
  const { t, i18n } = useTranslation();
  const {
    tables,
    relationships,
    setTables,
    setRelationships,
    database,
    setDatabase,
  } = useDiagram();
  const { notes, setNotes } = useNotes();
  const { areas, setAreas } = useAreas();
  const { types, setTypes } = useTypes();
  const { enums, setEnums } = useEnums();
  const { transform, setTransform } = useTransform();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const { settings, setSettings } = useSettings();
  const [uncontrolledTitle, setUncontrolledTitle] = useState(title);
  const [uncontrolledLanguage, setUncontrolledLanguage] = useState(
    i18n.language,
  );
  const [tempTableWidth, setTempTableWidth] = useState(settings.tableWidth);
  const [importSource, setImportSource] = useState({
    src: "",
    mode: IMPORT_MODE.OVERWRITE,
    diagram: null,
    preview: null,
    issues: [],
  });
  const [importData, setImportData] = useState(null);
  const [error, setError] = useState({
    type: STATUS.NONE,
    message: "",
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState(-1);
  const [selectedDiagramId, setSelectedDiagramId] = useState(0);
  const [saveAsTitle, setSaveAsTitle] = useState(title);
  const navigate = useNavigateWithParams();

  const getCurrentDiagram = () => {
    return {
      name: title,
      database,
      tables,
      relationships,
      notes,
      areas,
      types,
      enums,
      pan: transform.pan,
      zoom: transform.zoom,
    };
  };

  const applyImportedDiagram = ({ importedDiagram, mode }) => {
    if (!importedDiagram) {
      setError({
        type: STATUS.ERROR,
        message: "Import failed.",
      });
      return;
    }

    try {
      const result = applyImportMode({
        currentDiagram: getCurrentDiagram(),
        importedDiagram,
        mode,
      });
      const nextDiagram = result.diagram;
      const nextDatabase = nextDiagram.database ?? database;

      setDatabase(nextDatabase);
      setTitle(nextDiagram.name || nextDiagram.title || title);
      setTables(nextDiagram.tables);
      setRelationships(nextDiagram.relationships);
      setAreas(nextDiagram.areas ?? nextDiagram.subjectAreas ?? []);
      setNotes(nextDiagram.notes ?? []);
      setTransform({
        pan: nextDiagram.pan ?? { x: 0, y: 0 },
        zoom: nextDiagram.zoom ?? 1,
      });

      if (databases[nextDatabase].hasTypes) {
        setTypes(nextDiagram.types ?? []);
      } else {
        setTypes([]);
      }

      if (databases[nextDatabase].hasEnums) {
        setEnums(nextDiagram.enums ?? []);
      } else {
        setEnums([]);
      }

      if (importedDiagram.customTypes) {
        mergeCustomTypes(importedDiagram.customTypes);
      }
      setUndoStack([]);
      setRedoStack([]);

      if (result.isNewDiagram) {
        navigate("/editor?importAsNew=1", { replace: true });
      }

      setModal(MODAL.NONE);
    } catch (e) {
      setError({
        type: STATUS.ERROR,
        message: `Please check for syntax errors or let us know about the error.`,
      });
    }
  };

  const getModalOnOk = async () => {
    switch (modal) {
      case MODAL.IMG:
        saveAs(
          exportData.data,
          `${exportData.filename}.${exportData.extension}`,
        );
        return;
      case MODAL.CODE: {
        const blob = new Blob([exportData.data], {
          type: "application/json",
        });
        saveAs(blob, `${exportData.filename}.${exportData.extension}`);
        return;
      }
      case MODAL.IMPORT:
        if (error.type !== STATUS.ERROR) {
          applyImportedDiagram({
            importedDiagram: importData.diagram,
            mode: importData.mode,
          });
          setImportData(null);
        }
        return;
      case MODAL.IMPORT_SRC:
        applyImportedDiagram({
          importedDiagram: importSource.diagram,
          mode: importSource.mode,
        });
        return;
      case MODAL.OPEN:
        if (!selectedDiagramId) return;
        navigate(`/editor/diagrams/${selectedDiagramId}`, "_blank");
        setModal(MODAL.NONE);
        return;
      case MODAL.RENAME:
        setTitle(uncontrolledTitle);
        setModal(MODAL.NONE);
        return;
      case MODAL.SAVEAS:
        setTitle(saveAsTitle);
        setModal(MODAL.NONE);
        return;
      case MODAL.NEW:
        window.open("/editor/templates/" + selectedTemplateId, "_blank");
        setModal(MODAL.NONE);
        return;
      case MODAL.LANGUAGE:
        i18n.changeLanguage(uncontrolledLanguage);
        setModal(MODAL.NONE);
        return;
      case MODAL.TABLE_WIDTH:
        setSettings((prev) => ({ ...prev, tableWidth: tempTableWidth }));
        setModal(MODAL.NONE);
        return;
      default:
        setModal(MODAL.NONE);
        return;
    }
  };

  const getModalBody = () => {
    switch (modal) {
      case MODAL.IMPORT:
        return (
          <ImportDiagram
            importData={importData}
            setImportData={setImportData}
            error={error}
            setError={setError}
            importFrom={importFrom}
          />
        );
      case MODAL.IMPORT_SRC:
        return (
          <ImportSource
            importData={importSource}
            setImportData={setImportSource}
            error={error}
            setError={setError}
            dialect={database === DB.GENERIC ? importDb : database}
            diagramDatabase={database}
          />
        );
      case MODAL.NEW:
        return (
          <New
            selectedTemplateId={selectedTemplateId}
            setSelectedTemplateId={setSelectedTemplateId}
          />
        );
      case MODAL.RENAME:
        return (
          <Rename key={title} title={title} setTitle={setUncontrolledTitle} />
        );
      case MODAL.OPEN:
        return (
          <Open
            selectedDiagramId={selectedDiagramId}
            setSelectedDiagramId={setSelectedDiagramId}
          />
        );
      case MODAL.SAVEAS:
        return (
          <Input
            placeholder={t("name")}
            value={saveAsTitle}
            onChange={(v) => setSaveAsTitle(v)}
          />
        );
      case MODAL.CODE:
      case MODAL.IMG:
        if (exportData.data !== "" || exportData.data) {
          return (
            <>
              {modal === MODAL.IMG ? (
                <Image src={exportData.data} alt="Diagram" height={280} />
              ) : (
                <CodeEditor
                  height={360}
                  value={exportData.data}
                  language={extensionToLanguage[exportData.extension]}
                  options={{ readOnly: true }}
                  showCopyButton={true}
                />
              )}
              <div className="text-sm font-semibold mt-2">{t("filename")}:</div>
              <Input
                value={exportData.filename}
                placeholder={t("filename")}
                suffix={<div className="p-2">{`.${exportData.extension}`}</div>}
                onChange={(value) =>
                  setExportData((prev) => ({ ...prev, filename: value }))
                }
                field="filename"
              />
            </>
          );
        } else {
          return (
            <div className="text-center my-3 text-sky-600">
              <Spin tip={t("loading")} size="large" />
            </div>
          );
        }
      case MODAL.TABLE_WIDTH:
        return (
          <SetTableWidth
            tempWidth={tempTableWidth}
            setTempWidth={setTempTableWidth}
          />
        );
      case MODAL.LANGUAGE:
        return (
          <Language
            language={uncontrolledLanguage}
            setLanguage={setUncontrolledLanguage}
          />
        );
      case MODAL.SHARE:
        return <Share title={title} setModal={setModal} />;
      default:
        return <></>;
    }
  };

  return (
    <SemiUIModal
      style={isRtl(i18n.language) ? { direction: "rtl" } : {}}
      title={getModalTitle(modal)}
      visible={modal !== MODAL.NONE && modal !== MODAL.CONFIG_CUSTOM_TYPES}
      onOk={getModalOnOk}
      afterClose={() => {
        setExportData(() => ({
          data: "",
          extension: "",
          filename: `${title}_${new Date().toISOString()}`,
        }));
        setError({
          type: STATUS.NONE,
          message: "",
        });
        setImportData(null);
        setImportSource({
          src: "",
          mode: IMPORT_MODE.OVERWRITE,
          diagram: null,
          preview: null,
          issues: [],
        });
      }}
      onCancel={() => {
        if (modal === MODAL.RENAME) setUncontrolledTitle(title);
        if (modal === MODAL.LANGUAGE) setUncontrolledLanguage(i18n.language);
        if (modal === MODAL.TABLE_WIDTH) setTempTableWidth(settings.tableWidth);
        setModal(MODAL.NONE);
      }}
      centered
      closeOnEsc={true}
      okText={getOkText(modal)}
      okButtonProps={{
        disabled:
          (error && error?.type === STATUS.ERROR) ||
          (modal === MODAL.IMPORT &&
            (error.type === STATUS.ERROR || !importData?.diagram)) ||
          (modal === MODAL.RENAME && title === "") ||
          ((modal === MODAL.IMG || modal === MODAL.CODE) && !exportData.data) ||
          (modal === MODAL.SAVEAS && saveAsTitle === "") ||
          (modal === MODAL.IMPORT_SRC &&
            (importSource.src === "" || !importSource.diagram)),
        hidden: modal === MODAL.SHARE,
      }}
      hasCancel={modal !== MODAL.SHARE}
      cancelText={t("cancel")}
      width={getModalWidth(modal)}
      bodyStyle={{
        maxHeight: window.innerHeight - 280,
        overflow:
          modal === MODAL.CODE || modal === MODAL.IMG ? "hidden" : "auto",
        direction: "ltr",
      }}
    >
      {getModalBody()}
    </SemiUIModal>
  );
}
