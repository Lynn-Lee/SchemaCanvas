import { useState } from "react";
import { Button, Modal } from "@douyinfe/semi-ui";
import { IconUser } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import {
  getCloudCapability,
  useExtensions,
} from "../../context/ExtensionsContext";
import CloudAccountStatus from "../../features/cloud/CloudAccountStatus";

function resolveCloudAccountStatus(extensions = {}) {
  const session = extensions.cloudSession ?? {};
  if (session.status === "signed-in" || session.status === "authenticated") {
    return "signed-in";
  }
  if (session.status === "expired" || session.status === "expired-session") {
    return "expired-session";
  }
  return "signed-out";
}

export default function CloudAccountEntry() {
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const extensions = useExtensions();
  const capability = getCloudCapability(extensions);
  const { t } = useTranslation();

  if (!capability.enabled) {
    return null;
  }

  const openAccount = () => {
    if (extensions.openCloudAccount) {
      extensions.openCloudAccount({ capability });
      return;
    }
    setIsAccountOpen(true);
  };

  return (
    <>
      <Button
        type="tertiary"
        icon={<IconUser />}
        aria-label={t("cloud_account")}
        onClick={openAccount}
      >
        {t("cloud_account")}
      </Button>
      <Modal
        title={t("cloud_account")}
        visible={isAccountOpen}
        footer={null}
        onCancel={() => setIsAccountOpen(false)}
      >
        <CloudAccountStatus
          status={resolveCloudAccountStatus(extensions)}
          account={extensions.cloudSession?.account}
          onSignIn={extensions.signInCloudAccount}
          onSignOut={extensions.signOutCloudAccount}
        />
      </Modal>
    </>
  );
}
