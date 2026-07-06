import { useTranslation } from "react-i18next";
import icon from "../assets/icon_dark_64.png";

const sizeClasses = {
  sm: {
    frame: "h-8 w-8",
    icon: "h-7 w-7",
    text: "text-xl sm:text-lg",
  },
  md: {
    frame: "h-11 w-11 sm:h-9 sm:w-9",
    icon: "h-9 w-9 sm:h-7 sm:w-7",
    text: "text-3xl sm:text-xl",
  },
};

export default function BrandLogo({
  theme = "light",
  size = "md",
  className = "",
}) {
  const { t } = useTranslation();
  const resolvedSize = sizeClasses[size] ?? sizeClasses.md;
  const textColor = theme === "dark" ? "text-white" : "text-[#12495e]";

  return (
    <span className={`inline-flex items-center gap-3 ${className}`.trim()}>
      <span
        className={`${resolvedSize.frame} inline-flex shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-white shadow-xs`}
      >
        <img
          src={icon}
          alt={t("brand_logo_alt")}
          className={`${resolvedSize.icon} rounded-lg`}
        />
      </span>
      <span
        className={`${resolvedSize.text} ${textColor} font-extrabold leading-none`}
      >
        SchemaCanvas
      </span>
    </span>
  );
}
