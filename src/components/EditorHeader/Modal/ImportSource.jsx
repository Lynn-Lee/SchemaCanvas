import { Upload, Banner, Tabs, TabPane } from "@douyinfe/semi-ui";
import { STATUS } from "../../../data/constants";
import { useTranslation } from "react-i18next";
import CodeEditor from "../../CodeEditor";
import {
  validateImportFile,
  validateImportText,
} from "../../../features/import/importLimits";
import { importSqlText } from "../../../features/import/importSqlService";
import ImportModeSelector from "./ImportModeSelector";

export default function ImportSource({
  importData,
  setImportData,
  error,
  setError,
  dialect,
  diagramDatabase,
}) {
  const { t } = useTranslation();
  const setImportResult = (sql) => {
    const limitResult = validateImportText(sql, { label: "SQL" });
    if (!limitResult.ok) {
      setImportData((prev) => ({
        ...prev,
        src: sql,
        diagram: null,
        preview: null,
        issues: [],
      }));
      setError({
        type: STATUS.ERROR,
        message: limitResult.message,
      });
      return;
    }

    const result = importSqlText({ sql, dialect, diagramDatabase });
    setImportData((prev) => ({
      ...prev,
      src: sql,
      diagram: result.diagram,
      preview: result.preview,
      issues: result.issues,
    }));

    if (!result.ok) {
      setError({
        type: STATUS.ERROR,
        message: result.issues[0]?.message ?? "SQL import failed.",
      });
      return;
    }

    if (result.preview.warningCount > 0) {
      setError({
        type: STATUS.WARNING,
        message: `Preview: ${result.preview.tableCount} tables, ${result.preview.relationshipCount} relationships, ${result.preview.warningCount} warnings.`,
      });
      return;
    }

    setError({
      type: STATUS.OK,
      message: `Preview: ${result.preview.tableCount} tables, ${result.preview.relationshipCount} relationships.`,
    });
  };

  return (
    <div>
      <Tabs>
        <TabPane tab={t("insert_sql")} itemKey="text-import">
          <CodeEditor
            height={224}
            language="sql"
            onChange={(value) => {
              setImportResult(value);
            }}
          />
        </TabPane>
        <TabPane tab={t("upload_file")} itemKey="file-import">
          <Upload
            action="#"
            beforeUpload={({ file, fileList }) => {
              const f = fileList[0].fileInstance;
              if (!f) {
                return;
              }
              const fileLimitResult = validateImportFile(f);
              if (!fileLimitResult.ok) {
                setError({
                  type: STATUS.ERROR,
                  message: fileLimitResult.message,
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
                const textLimitResult = validateImportText(e.target.result, {
                  label: "SQL",
                });
                if (!textLimitResult.ok) {
                  setError({
                    type: STATUS.ERROR,
                    message: textLimitResult.message,
                  });
                  return;
                }
                setImportResult(e.target.result);
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
            dragSubText={t("upload_sql_to_generate_diagrams")}
            accept=".sql"
            onRemove={() => {
              setError({
                type: STATUS.NONE,
                message: "",
              });
              setImportData((prev) => ({ ...prev, src: "" }));
            }}
            onFileChange={() =>
              setError({
                type: STATUS.NONE,
                message: "",
              })
            }
            limit={1}
          />
        </TabPane>
      </Tabs>

      <div className="mt-2">
        <ImportModeSelector
          value={importData.mode}
          onChange={(mode) =>
            setImportData((prev) => ({
              ...prev,
              mode,
            }))
          }
        />
        <div className="mt-2">
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
      </div>
    </div>
  );
}
