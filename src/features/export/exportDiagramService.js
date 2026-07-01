import { toJpeg, toPng, toSvg } from "html-to-image";
import jsPDF from "jspdf";

import { DB } from "../../data/constants";
import { normalizeDiagram } from "../../domain/normalizeDiagram";
import { toDBML } from "../../utils/exportAs/dbml";
import { jsonToDocumentation } from "../../utils/exportAs/documentation";
import { jsonToMermaid } from "../../utils/exportAs/mermaid";
import { exportSQL } from "../../utils/exportSQL";

const SQL_DATABASES = new Set([
  DB.MYSQL,
  DB.POSTGRES,
  DB.SQLITE,
  DB.MARIADB,
  DB.MSSQL,
  DB.ORACLESQL,
]);

function ensureTrailingNewline(value) {
  const normalized = String(value ?? "").replace(/\r\n/g, "\n");
  return normalized.endsWith("\n") ? normalized : `${normalized}\n`;
}

function exportableDiagram(diagram) {
  const normalized = normalizeDiagram(diagram);
  return {
    ...normalized,
    references: normalized.relationships,
  };
}

function issue(id, message) {
  return {
    id,
    severity: "error",
    objectType: "export",
    message,
  };
}

function exportableDocumentDiagram(diagram) {
  const model = exportableDiagram(diagram);
  return {
    ...model,
    title: model.name,
    subjectAreas: model.areas,
  };
}

function failedExport({ format, extension, issueId, message, content = "" }) {
  return {
    ok: false,
    format,
    extension,
    content,
    issues: [issue(issueId, message)],
  };
}

export function exportDiagram({ diagram, format }) {
  const normalizedFormat = String(format ?? "").toLowerCase();
  const model = exportableDiagram(diagram);

  if (normalizedFormat === "sql") {
    if (!SQL_DATABASES.has(model.database)) {
      return {
        ok: false,
        format: normalizedFormat,
        extension: "sql",
        content: "",
        issues: [
          issue(
            "unsupported-sql-export-database",
            "SQL export is not supported for this diagram database.",
          ),
        ],
      };
    }

    return {
      ok: true,
      format: normalizedFormat,
      extension: "sql",
      content: ensureTrailingNewline(exportSQL(model)),
      issues: [],
    };
  }

  if (normalizedFormat === "dbml") {
    return {
      ok: true,
      format: normalizedFormat,
      extension: "dbml",
      content: ensureTrailingNewline(toDBML(model)),
      issues: [],
    };
  }

  if (normalizedFormat === "markdown") {
    return {
      ok: true,
      format: normalizedFormat,
      extension: "md",
      content: ensureTrailingNewline(jsonToDocumentation(exportableDocumentDiagram(diagram))),
      issues: [],
    };
  }

  if (normalizedFormat === "mermaid") {
    return {
      ok: true,
      format: normalizedFormat,
      extension: "md",
      content: ensureTrailingNewline(jsonToMermaid(exportableDocumentDiagram(diagram))),
      issues: [],
    };
  }

  return {
    ok: false,
    format: normalizedFormat,
    extension: "",
    content: "",
    issues: [
      issue(
        "unsupported-export-format",
        "The requested export format is not supported.",
      ),
    ],
  };
}

const defaultImageRenderers = {
  toPng,
  toJpeg,
  toSvg,
};

const imageExportOptions = {
  png: (pixelRatio) => ({ pixelRatio }),
  jpeg: () => ({ quality: 0.95 }),
  svg: () => ({ filter: (node) => node.tagName !== "i" }),
};

const imageExporters = {
  png: "toPng",
  jpeg: "toJpeg",
  svg: "toSvg",
};

export async function exportCanvasImage({
  element,
  format,
  renderers = {},
  pixelRatio = 2,
}) {
  const normalizedFormat = String(format ?? "").toLowerCase();
  const rendererName = imageExporters[normalizedFormat];

  if (!rendererName) {
    return failedExport({
      format: normalizedFormat,
      extension: "",
      issueId: "unsupported-image-export-format",
      message: "The requested image export format is not supported.",
    });
  }

  if (!element) {
    return failedExport({
      format: normalizedFormat,
      extension: normalizedFormat,
      issueId: "missing-export-canvas",
      message: "Canvas element is required before exporting an image.",
    });
  }

  const renderer = {
    ...defaultImageRenderers,
    ...renderers,
  }[rendererName];

  try {
    return {
      ok: true,
      format: normalizedFormat,
      extension: normalizedFormat,
      content: await renderer(
        element,
        imageExportOptions[normalizedFormat](pixelRatio),
      ),
      issues: [],
    };
  } catch (error) {
    return failedExport({
      format: normalizedFormat,
      extension: normalizedFormat,
      issueId: "image-export-failed",
      message: error?.message ?? "Image export failed.",
    });
  }
}

export async function exportCanvasPdf({
  element,
  title = "diagram",
  renderers = {},
  PdfDocument = jsPDF,
  now = () => new Date(),
}) {
  if (!element) {
    return failedExport({
      format: "pdf",
      extension: "pdf",
      content: null,
      issueId: "missing-export-canvas",
      message: "Canvas element is required before exporting a PDF.",
    });
  }

  const renderer = {
    ...defaultImageRenderers,
    ...renderers,
  }.toJpeg;

  try {
    const dataUrl = await renderer(element);
    const doc = new PdfDocument("l", "px", [
      element.offsetWidth,
      element.offsetHeight,
    ]);
    doc.addImage(
      dataUrl,
      "jpeg",
      0,
      0,
      element.offsetWidth,
      element.offsetHeight,
    );
    doc.save(`${title}_${now().toISOString()}.pdf`);

    return {
      ok: true,
      format: "pdf",
      extension: "pdf",
      content: null,
      issues: [],
    };
  } catch (error) {
    return failedExport({
      format: "pdf",
      extension: "pdf",
      content: null,
      issueId: "pdf-export-failed",
      message: error?.message ?? "PDF export failed.",
    });
  }
}
