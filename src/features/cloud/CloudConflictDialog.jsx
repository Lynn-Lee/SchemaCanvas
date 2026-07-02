import { Button, Modal } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";

export default function CloudConflictDialog({
  visible,
  remoteModifiedAt,
  onKeepLocal,
  onOverwriteCloud,
  onSaveAsLocal,
  onCancel,
}) {
  const { t } = useTranslation();

  return (
    <Modal
      title={t("cloud_conflict_title")}
      visible={visible}
      footer={null}
      onCancel={onCancel}
    >
      <div className="space-y-4">
        <p>{t("cloud_conflict_description")}</p>
        {remoteModifiedAt ? (
          <p className="text-sm text-slate-600">{remoteModifiedAt}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="primary" onClick={onKeepLocal}>
            {t("cloud_conflict_keep_local")}
          </Button>
          <Button type="warning" onClick={onOverwriteCloud}>
            {t("cloud_conflict_overwrite_cloud")}
          </Button>
          <Button type="tertiary" onClick={onSaveAsLocal}>
            {t("cloud_conflict_save_as_local")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
