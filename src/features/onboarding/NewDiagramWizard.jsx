import { useState } from "react";
import { Button, Tag } from "@douyinfe/semi-ui";

import { DB } from "../../data/constants";

const DATABASE_OPTIONS = [
  {
    name: "Generic",
    label: DB.GENERIC,
    description: "Portable diagram without dialect-specific constraints.",
  },
  {
    name: "MySQL",
    label: DB.MYSQL,
    description: "Use MySQL-oriented types and export defaults.",
  },
  {
    name: "PostgreSQL",
    label: DB.POSTGRES,
    description: "Use PostgreSQL types, enums, and arrays.",
  },
  {
    name: "SQLite",
    label: DB.SQLITE,
    description: "Use SQLite-friendly schema defaults.",
  },
  {
    name: "MariaDB",
    label: DB.MARIADB,
    description: "Use MariaDB-oriented types and export defaults.",
  },
  {
    name: "MSSQL",
    label: DB.MSSQL,
    description: "Use SQL Server-oriented schema defaults.",
  },
  {
    name: "Oracle SQL",
    label: DB.ORACLESQL,
    description: "Use Oracle-oriented schema defaults.",
    beta: true,
  },
];

export default function NewDiagramWizard({
  onCreateBlank,
  onOpenTemplates,
  onOpenImport,
}) {
  const [selectedDatabase, setSelectedDatabase] = useState(DB.GENERIC);

  return (
    <section
      aria-labelledby="new-diagram-wizard-title"
      className="absolute inset-0 z-30 overflow-y-auto bg-white/95 px-5 py-6 text-zinc-900 backdrop-blur dark:bg-zinc-950/95 dark:text-zinc-50"
    >
      <div className="mx-auto flex min-h-full max-w-5xl flex-col justify-center gap-6">
        <div className="max-w-2xl space-y-2">
          <p className="text-sm font-medium uppercase tracking-normal text-zinc-500 dark:text-zinc-400">
            Local-first editor
          </p>
          <h1
            id="new-diagram-wizard-title"
            className="text-3xl font-semibold tracking-normal"
          >
            Create a local diagram
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Saved by default in this browser only.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {DATABASE_OPTIONS.map((database) => {
            const isSelected = selectedDatabase === database.label;
            return (
              <button
                key={database.label}
                type="button"
                aria-label={database.name}
                aria-pressed={isSelected}
                onClick={() => setSelectedDatabase(database.label)}
                className={`min-h-28 rounded-md border p-3 text-left transition ${
                  isSelected
                    ? "border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800"
                    : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-500"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold">{database.name}</span>
                  {database.beta && (
                    <Tag size="small" color="light-blue">
                      Beta
                    </Tag>
                  )}
                </div>
                <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
                  {database.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            theme="solid"
            type="primary"
            onClick={() => onCreateBlank(selectedDatabase)}
          >
            Create blank diagram
          </Button>
          <Button onClick={onOpenTemplates}>Start from template</Button>
          <Button onClick={onOpenImport}>Import SQL, DBML, or JSON</Button>
        </div>
      </div>
    </section>
  );
}
