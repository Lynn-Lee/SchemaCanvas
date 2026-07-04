import { socials } from "../data/socials";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="p-3 space-y-2">
      <p>{t("not_found_greeting")}</p>

      <p>{t("not_found_prompt")}</p>
      <p>
        {t("not_found_check_out")}{" "}
        <a
          className="text-blue-600"
          href={`${socials.github}/issues`}
          target="_blank"
          rel="noreferrer"
        >
          {t("not_found_github_issues")}
        </a>
      </p>
      <br />
      <p className="opacity-70">
        {t("not_found_relationship_hint")}
      </p>
    </div>
  );
}
