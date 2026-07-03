import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

const localeDefinitions = {
  en: {
    name: "English",
    native_name: "English",
    code: "en",
    exportName: "en",
    loader: () => import("./locales/en"),
  },
  bg: {
    name: "Bulgarian",
    native_name: "Български",
    code: "bg",
    exportName: "bg",
    loader: () => import("./locales/bg"),
  },
  zh: {
    name: "Simplified Chinese",
    native_name: "简体中文",
    code: "zh",
    exportName: "zh",
    loader: () => import("./locales/zh"),
  },
  da: {
    name: "Danish",
    native_name: "Dansk",
    code: "da",
    exportName: "da",
    loader: () => import("./locales/da"),
  },
  es: {
    name: "Spanish",
    native_name: "Español",
    code: "es",
    exportName: "es",
    loader: () => import("./locales/es"),
  },
  de: {
    name: "German",
    native_name: "Deutsch",
    code: "de",
    exportName: "de",
    loader: () => import("./locales/de"),
  },
  vi: {
    name: "Vietnamese",
    native_name: "Tiếng Việt",
    code: "vi",
    exportName: "vi",
    loader: () => import("./locales/vi"),
  },
  "pt-BR": {
    name: "Portuguese",
    native_name: "Português",
    code: "pt-BR",
    exportName: "pt",
    loader: () => import("./locales/pt-br"),
  },
  fa: {
    name: "Persian",
    native_name: "فارسی",
    code: "fa",
    exportName: "fa",
    loader: () => import("./locales/fa"),
  },
  hi: {
    name: "Hindi",
    native_name: "हिंदी",
    code: "hi",
    exportName: "hi",
    loader: () => import("./locales/hi"),
  },
  as: {
    name: "Assamese",
    native_name: "অসমীয়া",
    code: "as",
    exportName: "as",
    loader: () => import("./locales/as"),
  },
  mr: {
    name: "Marathi",
    native_name: "मराठी",
    code: "mr",
    exportName: "mr",
    loader: () => import("./locales/mr"),
  },
  el: {
    name: "Greek",
    native_name: "Ελληνικά",
    code: "el",
    exportName: "el",
    loader: () => import("./locales/el"),
  },
  uk: {
    name: "Ukrainian",
    native_name: "Українська",
    code: "uk",
    exportName: "uk",
    loader: () => import("./locales/uk"),
  },
  ru: {
    name: "Russian",
    native_name: "Русский",
    code: "ru",
    exportName: "ru",
    loader: () => import("./locales/ru"),
  },
  ro: {
    name: "Romanian",
    native_name: "Română",
    code: "ro",
    exportName: "ro",
    loader: () => import("./locales/ro"),
  },
  tr: {
    name: "Turkish",
    native_name: "Türkçe",
    code: "tr",
    exportName: "tr",
    loader: () => import("./locales/tr"),
  },
  fr: {
    name: "French",
    native_name: "Français",
    code: "fr",
    exportName: "fr",
    loader: () => import("./locales/fr"),
  },
  pa: {
    name: "Punjabi",
    native_name: "ਪੰਜਾਬੀ",
    code: "pa",
    exportName: "pa",
    loader: () => import("./locales/pa"),
  },
  hy: {
    name: "Armenian",
    native_name: "Հայերեն",
    code: "hy",
    exportName: "hy",
    loader: () => import("./locales/hy"),
  },
  ar: {
    name: "Arabic",
    native_name: "العربية",
    code: "ar",
    exportName: "ar",
    loader: () => import("./locales/ar"),
  },
  "zh-TW": {
    name: "Traditional Chinese",
    native_name: "繁體中文",
    code: "zh-TW",
    exportName: "zh_tw",
    loader: () => import("./locales/zh-tw"),
  },
  he: {
    name: "Hebrew",
    native_name: "עברית",
    code: "he",
    exportName: "he",
    loader: () => import("./locales/he"),
  },
  hu: {
    name: "Hungarian",
    native_name: "Magyar",
    code: "hu",
    exportName: "hu",
    loader: () => import("./locales/hu"),
  },
  id: {
    name: "Indonesian",
    native_name: "Bahasa Indonesia",
    code: "id",
    exportName: "id",
    loader: () => import("./locales/id"),
  },
  te: {
    name: "Telugu",
    native_name: "తెలుగు",
    code: "te",
    exportName: "te",
    loader: () => import("./locales/te"),
  },
  tm: {
    name: "Tamil",
    native_name: "தமிழ்",
    code: "tm",
    exportName: "tm",
    loader: () => import("./locales/tm"),
  },
  gu: {
    name: "Gujarati",
    native_name: "ગુજરાતી",
    code: "gu",
    exportName: "gu",
    loader: () => import("./locales/gu"),
  },
  it: {
    name: "Italian",
    native_name: "Italiano",
    code: "it",
    exportName: "it",
    loader: () => import("./locales/it"),
  },
  ko: {
    name: "Korean",
    native_name: "한국어",
    code: "ko",
    exportName: "ko",
    loader: () => import("./locales/ko"),
  },
  od: {
    name: "Odia",
    native_name: "ଓଡିଆ",
    code: "od",
    exportName: "od",
    loader: () => import("./locales/od"),
  },
  bn: {
    name: "Bengali",
    native_name: "বাংলা",
    code: "bn",
    exportName: "bn",
    loader: () => import("./locales/bn"),
  },
  ka: {
    name: "Kannada",
    native_name: "ಕನ್ನಡ",
    code: "ka",
    exportName: "ka",
    loader: () => import("./locales/ka"),
  },
  pl: {
    name: "Polish",
    native_name: "Polski",
    code: "pl",
    exportName: "pl",
    loader: () => import("./locales/pl"),
  },
  no: {
    name: "Norwegian",
    native_name: "Norsk",
    code: "no",
    exportName: "no",
    loader: () => import("./locales/no"),
  },
  sv: {
    name: "Swedish",
    native_name: "Svenska",
    code: "sv",
    exportName: "sv",
    loader: () => import("./locales/sv-se"),
  },
  ur: {
    name: "Urdu",
    native_name: "اردو",
    code: "ur",
    exportName: "ur",
    loader: () => import("./locales/ur"),
  },
  jp: {
    name: "Japanese",
    native_name: "Japanese",
    code: "jp",
    exportName: "jp",
    loader: () => import("./locales/jp"),
  },
  ne: {
    name: "Nepali",
    native_name: "नेपाली",
    code: "ne",
    exportName: "ne",
    loader: () => import("./locales/ne"),
  },
  ug: {
    name: "Uyghur",
    native_name: "ئۇيغۇرچە",
    code: "ug",
    exportName: "ug",
    loader: () => import("./locales/ug"),
  },
  "pa-PK": {
    name: "Punjabi Pakistan",
    native_name: "پنجابی",
    code: "pa-PK",
    exportName: "pa_pk",
    loader: () => import("./locales/pa-pk"),
  },
  cz: {
    name: "Czech",
    native_name: "Česko",
    code: "cz",
    exportName: "cz",
    loader: () => import("./locales/cz"),
  },
  ml: {
    name: "Malayalam",
    native_name: "മലയാളം",
    code: "ml",
    exportName: "ml",
    loader: () => import("./locales/ml"),
  },
  nl: {
    name: "Dutch",
    native_name: "Nederlands",
    code: "nl",
    exportName: "nl",
    loader: () => import("./locales/nl"),
  },
  sd: {
    name: "Sindhi",
    native_name: "سنڌي",
    code: "sd",
    exportName: "sd",
    loader: () => import("./locales/sd"),
  },
  th: {
    name: "Thai",
    native_name: "ไทย",
    code: "th",
    exportName: "th",
    loader: () => import("./locales/th"),
  },
  ms: {
    name: "Malay",
    native_name: "Bahasa Melayu",
    code: "ms",
    exportName: "ms",
    loader: () => import("./locales/ms"),
  },
  mn: {
    name: "Mongolian",
    native_name: "Монгол",
    code: "mn",
    exportName: "mn",
    loader: () => import("./locales/mn"),
  },
  tl: {
    name: "Filipino",
    native_name: "Filipino",
    code: "tl",
    exportName: "tl",
    loader: () => import("./locales/tl"),
  },
  sw: {
    name: "Swahili",
    native_name: "Kiswahili",
    code: "sw",
    exportName: "sw",
    loader: () => import("./locales/sw"),
  },
  fi: {
    name: "Finnish",
    native_name: "Suomi",
    code: "fi",
    exportName: "fi",
    loader: () => import("./locales/fi"),
  },
};

export const languages = Object.values(localeDefinitions)
  .map(({ code, name, native_name }) => ({ code, name, native_name }))
  .sort((a, b) => a.name.localeCompare(b.name));

const normalizeLanguageCode = (language) => {
  if (!language) return "en";
  if (localeDefinitions[language]) return language;

  const normalized = language
    .split("-")
    .map((part, index) =>
      index === 0 ? part.toLowerCase() : part.toUpperCase(),
    )
    .join("-");

  if (localeDefinitions[normalized]) return normalized;

  const baseLanguage = normalized.split("-")[0];
  return localeDefinitions[baseLanguage] ? baseLanguage : "en";
};

export const loadLanguageResources = async (language) => {
  const languageCode = normalizeLanguageCode(language);
  const locale = localeDefinitions[languageCode];

  if (i18n.hasResourceBundle(languageCode, "translation")) {
    return languageCode;
  }

  const localeModule = await locale.loader();
  const resource = localeModule[locale.exportName];

  i18n.addResourceBundle(
    languageCode,
    "translation",
    resource.translation,
    true,
    true,
  );

  return languageCode;
};

const lazyLocaleBackend = {
  type: "backend",
  init() {},
  read(language, namespace, callback) {
    loadLanguageResources(language)
      .then((languageCode) => {
        const bundle = i18n.getResourceBundle(languageCode, namespace);
        callback(null, bundle);
      })
      .catch((error) => {
        callback(error, null);
      });
  },
};

i18n
  .use(lazyLocaleBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    supportedLngs: languages.map((language) => language.code),
    nonExplicitSupportedLngs: true,
    debug: false,
    interpolation: {
      escapeValue: false,
    },
  });

const changeLanguage = i18n.changeLanguage.bind(i18n);
i18n.changeLanguage = async (language, callback) => {
  const languageCode = await loadLanguageResources(language);
  return changeLanguage(languageCode, callback);
};

export default i18n;
