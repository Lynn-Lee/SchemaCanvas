import JSZip from "jszip";
import { db } from "../data/db";
import { saveAs } from "file-saver";

const formatDiagram = (diagram) => {
  const formattedDiagram = { ...diagram };
  formattedDiagram.relationships = diagram.references;
  formattedDiagram.subjectAreas = diagram.areas;

  delete formattedDiagram.references;
  delete formattedDiagram.areas;

  return formattedDiagram;
};

const safeFilePart = (value, fallback = "untitled") => {
  const sanitized = String(value ?? fallback)
    .replace(/[<>:"/\\|?*]+/g, "_")
    .split("")
    .map((character) => (character.charCodeAt(0) < 32 ? "_" : character))
    .join("")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return sanitized || fallback;
};

const formatBackupTimestamp = (date) =>
  date.toISOString().replace(/\.\d{3}Z$/, "").replace(/:/g, "-");

const backupEntryName = ({ name, title, id }) =>
  `${safeFilePart(name ?? title)}_${safeFilePart(id, "item")}.json`;

export async function exportSavedData({ now = () => new Date() } = {}) {
  const zip = new JSZip();
  const diagramsFolder = zip.folder("diagrams");

  await db.diagrams.each((diagram) => {
    diagramsFolder.file(
      backupEntryName(diagram),
      JSON.stringify(formatDiagram(diagram), null, 2),
    );
    return true;
  });

  const templatesFolder = zip.folder("templates");

  await db.templates.where({ custom: 1 }).each((template) => {
    templatesFolder.file(
      backupEntryName(template),
      JSON.stringify(formatDiagram(template), null, 2),
    );
    return true;
  });

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `drawdb-backup-${formatBackupTimestamp(now())}.zip`);
}
