export async function seedLocalDiagram(page, diagram) {
  await page.goto("/");
  await page.evaluate(
    async ({ diagramToSeed }) => {
      const databaseName = "SchemaCanvas";
      const databaseVersion = 67;

      const requestToPromise = (request) =>
        new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });

      await new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(databaseName);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        request.onblocked = () =>
          reject(new Error("Timed out deleting the SchemaCanvas IndexedDB database."));
      });

      const openRequest = indexedDB.open(databaseName, databaseVersion);
      openRequest.onupgradeneeded = () => {
        const upgradeDatabase = openRequest.result;

        if (!upgradeDatabase.objectStoreNames.contains("diagrams")) {
          const diagrams = upgradeDatabase.createObjectStore("diagrams", {
            autoIncrement: true,
            keyPath: "id",
          });
          diagrams.createIndex("lastModified", "lastModified");
          diagrams.createIndex("loadedFromGistId", "loadedFromGistId");
          diagrams.createIndex("diagramId", "diagramId");
        }

        if (!upgradeDatabase.objectStoreNames.contains("templates")) {
          const templates = upgradeDatabase.createObjectStore("templates", {
            autoIncrement: true,
            keyPath: "id",
          });
          templates.createIndex("custom", "custom");
          templates.createIndex("templateId", "templateId");
        }
      };

      const database = await requestToPromise(openRequest);
      await new Promise((resolve, reject) => {
        const transaction = database.transaction("diagrams", "readwrite");
        transaction.objectStore("diagrams").put({
          ...diagramToSeed,
          lastModified: new Date(diagramToSeed.lastModified),
        });
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
      database.close();
    },
    {
      diagramToSeed: {
        ...diagram,
        lastModified: new Date("2026-07-02T00:00:00.000Z").toISOString(),
      },
    },
  );
}
