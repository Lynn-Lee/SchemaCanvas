import { Radio, RadioGroup, Typography } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";

import { IMPORT_MODE } from "../../../features/import/applyImportMode";

const importModeOptions = [
  {
    value: IMPORT_MODE.OVERWRITE,
    label: "import_mode_overwrite",
    description: "import_mode_overwrite_description",
  },
  {
    value: IMPORT_MODE.MERGE,
    label: "import_mode_merge",
    description: "import_mode_merge_description",
  },
  {
    value: IMPORT_MODE.NEW,
    label: "import_mode_new",
    description: "import_mode_new_description",
  },
];

export default function ImportModeSelector({ value, onChange }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <Typography.Text strong>{t("import_mode")}</Typography.Text>
      <RadioGroup
        direction="vertical"
        name="import-mode"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {importModeOptions.map((option) => (
          <Radio key={option.value} value={option.value}>
            <div>
              <div>{t(option.label)}</div>
              <Typography.Text type="tertiary" size="small">
                {t(option.description)}
              </Typography.Text>
            </div>
          </Radio>
        ))}
      </RadioGroup>
    </div>
  );
}
