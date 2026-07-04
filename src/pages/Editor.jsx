import LayoutContextProvider from "../context/LayoutContext";
import TransformContextProvider from "../context/TransformContext";
import TablesContextProvider from "../context/DiagramContext";
import UndoRedoContextProvider from "../context/UndoRedoContext";
import SelectContextProvider from "../context/SelectContext";
import AreasContextProvider from "../context/AreasContext";
import NotesContextProvider from "../context/NotesContext";
import TypesContextProvider from "../context/TypesContext";
import SettingsContextProvider from "../context/SettingsContext";
import SaveStateContextProvider from "../context/SaveStateContext";
import EnumsContextProvider from "../context/EnumsContext";
import CollabContextProvider from "../context/CollabContext";
import WorkSpace from "../components/Workspace";
import { useThemedPage } from "../hooks";

export default function Editor() {
  useThemedPage();

  return (
    <SettingsContextProvider>
      <LayoutContextProvider>
        <TransformContextProvider>
          <UndoRedoContextProvider>
            <SelectContextProvider>
              <CollabContextProvider>
                <AreasContextProvider>
                  <NotesContextProvider>
                    <TypesContextProvider>
                      <EnumsContextProvider>
                        <TablesContextProvider>
                          <SaveStateContextProvider>
                            <WorkSpace />
                          </SaveStateContextProvider>
                        </TablesContextProvider>
                      </EnumsContextProvider>
                    </TypesContextProvider>
                  </NotesContextProvider>
                </AreasContextProvider>
              </CollabContextProvider>
            </SelectContextProvider>
          </UndoRedoContextProvider>
        </TransformContextProvider>
      </LayoutContextProvider>
    </SettingsContextProvider>
  );
}
