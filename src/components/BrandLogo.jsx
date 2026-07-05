import icon from "../assets/icon-dark.png";

const sizeClasses = {
  sm: {
    icon: "h-7 w-7",
    text: "text-xl sm:text-lg",
  },
  md: {
    icon: "h-10 w-10 sm:h-8 sm:w-8",
    text: "text-3xl sm:text-xl",
  },
};

export default function BrandLogo({
  theme = "light",
  size = "md",
  className = "",
}) {
  const resolvedSize = sizeClasses[size] ?? sizeClasses.md;
  const textColor = theme === "dark" ? "text-white" : "text-[#12495e]";

  return (
    <span className={`inline-flex items-center gap-3 ${className}`.trim()}>
      <img
        src={icon}
        alt="SchemaCanvas logo"
        className={`${resolvedSize.icon} rounded-md`}
      />
      <span
        className={`${resolvedSize.text} ${textColor} font-extrabold leading-none`}
      >
        SchemaCanvas
      </span>
    </span>
  );
}
