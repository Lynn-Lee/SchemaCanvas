import i18n from "../i18n/i18n";

const templateCopyKeysByTitle = {
  "Blog database schema": {
    titleKey: "template_blog_title",
    descriptionKey: "template_blog_description",
  },
  "Human resources schema": {
    titleKey: "template_hr_title",
    descriptionKey: "template_hr_description",
  },
  "E-commerce schema": {
    titleKey: "template_ecommerce_title",
    descriptionKey: "template_ecommerce_description",
  },
  "Library schema": {
    titleKey: "template_library_title",
    descriptionKey: "template_library_description",
  },
  "Bank schema": {
    titleKey: "template_bank_title",
    descriptionKey: "template_bank_description",
  },
  "University schema": {
    titleKey: "template_university_title",
    descriptionKey: "template_university_description",
  },
};

export function getTemplateDisplayCopy(template) {
  if (!template || template.custom) {
    return {
      title: template?.title ?? "",
      description: template?.description ?? "",
    };
  }

  const copyKeys = templateCopyKeysByTitle[template.title];
  if (!copyKeys) {
    return {
      title: template.title,
      description: template.description ?? "",
    };
  }

  return {
    title: i18n.t(copyKeys.titleKey),
    description: i18n.t(copyKeys.descriptionKey),
  };
}
