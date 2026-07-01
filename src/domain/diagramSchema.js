const REQUIRED_STRING_FIELDS = ["diagramId", "name", "database"];
const REQUIRED_ARRAY_FIELDS = [
  "tables",
  "relationships",
  "notes",
  "areas",
  "types",
  "enums",
];

const addError = (errors, path, message) => {
  errors.push({ path, message });
};

export function validateDiagramShape(diagram) {
  const errors = [];

  if (!diagram || typeof diagram !== "object" || Array.isArray(diagram)) {
    addError(errors, "", "diagram must be an object.");
    return { valid: false, errors };
  }

  if (typeof diagram.schemaVersion !== "number") {
    addError(errors, "schemaVersion", "schemaVersion must be a number.");
  }

  REQUIRED_STRING_FIELDS.forEach((field) => {
    if (typeof diagram[field] !== "string" || diagram[field].trim() === "") {
      addError(errors, field, `${field} is required.`);
    }
  });

  REQUIRED_ARRAY_FIELDS.forEach((field) => {
    if (!Array.isArray(diagram[field])) {
      addError(errors, field, `${field} must be an array.`);
    }
  });

  if (
    !diagram.pan ||
    typeof diagram.pan !== "object" ||
    Array.isArray(diagram.pan)
  ) {
    addError(errors, "pan", "pan must be an object.");
  }

  if (typeof diagram.zoom !== "number") {
    addError(errors, "zoom", "zoom must be a number.");
  }

  return { valid: errors.length === 0, errors };
}
