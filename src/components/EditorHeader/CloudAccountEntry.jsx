import { Button } from "@douyinfe/semi-ui";
import { IconUser } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import {
  getCloudCapability,
  useExtensions,
} from "../../context/ExtensionsContext";

export default function CloudAccountEntry() {
  const extensions = useExtensions();
  const capability = getCloudCapability(extensions);
  const { t } = useTranslation();

  if (!capability.enabled) {
    return null;
  }

  const openAccount = () => {
    extensions.openCloudAccount?.({ capability });
  };

  return (
    <Button
      type="tertiary"
      icon={<IconUser />}
      aria-label={t("cloud_account")}
      onClick={openAccount}
    >
      {t("cloud_account")}
    </Button>
  );
}
