import { Upload, Banner } from "@douyinfe/semi-ui";
import { IMPORT_FROM, STATUS } from "../../../data/constants";
import {
  useAreas,
  useEnums,
  useNotes,
  useDiagram,
  useTypes,
} from "../../../hooks";
import { useTranslation } from "react-i18next";
import {
  validateImportFile,
} from "../../../features/import/importLimits";
import { importDiagramFileContent } from "../../../features/import/importDiagramService";

export default function ImportDiagram({
  setImportData,
  error,
  setError,
  importFrom,
}) {
  const { areas } = useAreas();
  const { notes } = useNotes();
  const { tables, relationships, database } = useDiagram();
  const { types } = useTypes();
  const { enums } = useEnums();
  const { t } = useTranslation();

  const diagramIsEmpty = () => {
    return (
      tables.length === 0 &&
      relationships.length === 0 &&
      notes.length === 0 &&
      areas.length === 0 &&
      types.length === 0 &&
      enums.length === 0
    );
  };

  const loadDiagramData = (file, e) => {
    const result = importDiagramFileContent({
      content: e.target.result,
      fileName: file.name,
      fileType: file.type,
      importFrom,
      currentDatabase: database,
    });

    if (!result.ok) {
      setImportData(null);
      setError({
        type: STATUS.ERROR,
        message: result.issues[0]?.message ?? "The file contains an error.",
      });
      return;
    }

    setImportData(result.diagram);
    if (diagramIsEmpty()) {
      setError({
        type: STATUS.OK,
        message: "Everything looks good. You can now import.",
      });
    } else {
      setError({
        type: STATUS.WARNING,
        message:
          "The current diagram is not empty. Importing a new diagram will overwrite the current changes.",
      });
    }
  };

  const getAcceptableFileTypes = () => {
    switch (importFrom) {
      case IMPORT_FROM.JSON:
        return "application/json,.ddb";
      case IMPORT_FROM.DBML:
        return ".dbml";
      default:
        return "";
    }
  };

  const getDragSubText = () => {
    switch (importFrom) {
      case IMPORT_FROM.JSON:
        return `${t("supported_types")} JSON, DDB`;
      case IMPORT_FROM.DBML:
        return `${t("supported_types")} DBML`;
      default:
        return "";
    }
  };

  return (
    <div>
      <Upload
        action="#"
        beforeUpload={({ file, fileList }) => {
          const f = fileList[0].fileInstance;
          if (!f) {
            return;
          }
          const limitResult = validateImportFile(f);
          if (!limitResult.ok) {
            setError({
              type: STATUS.ERROR,
              message: limitResult.message,
            });
            return {
              autoRemove: true,
              fileInstance: file.fileInstance,
              status: "error",
              shouldUpload: false,
            };
          }
          const reader = new FileReader();
          reader.onload = async (e) => {
            loadDiagramData(f, e);
          };
          reader.readAsText(f);

          return {
            autoRemove: false,
            fileInstance: file.fileInstance,
            status: "success",
            shouldUpload: false,
          };
        }}
        draggable={true}
        dragMainText={t("drag_and_drop_files")}
        dragSubText={getDragSubText()}
        accept={getAcceptableFileTypes()}
        onRemove={() =>
          setError({
            type: STATUS.NONE,
            message: "",
          })
        }
        onFileChange={() =>
          setError({
            type: STATUS.NONE,
            message: "",
          })
        }
        limit={1}
      />
      {error.type === STATUS.ERROR ? (
        <Banner
          type="danger"
          fullMode={false}
          description={<div>{error.message}</div>}
        />
      ) : error.type === STATUS.OK ? (
        <Banner
          type="info"
          fullMode={false}
          description={<div>{error.message}</div>}
        />
      ) : (
        error.type === STATUS.WARNING && (
          <Banner
            type="warning"
            fullMode={false}
            description={<div>{error.message}</div>}
          />
        )
      )}
    </div>
  );
}
