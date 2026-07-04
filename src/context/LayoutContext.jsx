import { createContext, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { queryConfig } from "../utils/queryConfig";

export const LayoutContext = createContext(null);

const defaultLayout = {
  header: true,
  sidebar: true,
  issues: true,
  toolbar: true,
  dbmlEditor: false,
  readOnly: false,
};

export default function LayoutContextProvider({ children }) {
  const [searchParams] = useSearchParams();

  const hideHeaderParam = searchParams.get(queryConfig.hideHeader.key);
  const hideSidebarParam = searchParams.get(queryConfig.hideSidebar.key);
  const hideToolbarParam = searchParams.get(queryConfig.hideToolbar.key);

  const [layout, setLayout] = useState({
    ...defaultLayout,
    header: queryConfig.hideHeader.isActive(hideHeaderParam)
      ? false
      : defaultLayout.header,
    sidebar: queryConfig.hideSidebar.isActive(hideSidebarParam)
      ? false
      : defaultLayout.sidebar,
    toolbar: queryConfig.hideToolbar.isActive(hideToolbarParam)
      ? false
      : defaultLayout.toolbar,
  });

  const effectiveLayout = useMemo(
    () => ({
      ...layout,
      header: queryConfig.hideHeader.isForced(hideHeaderParam)
        ? false
        : layout.header,
      sidebar: queryConfig.hideSidebar.isForced(hideSidebarParam)
        ? false
        : layout.sidebar,
      toolbar: queryConfig.hideToolbar.isForced(hideToolbarParam)
        ? false
        : layout.toolbar,
    }),
    [layout, hideHeaderParam, hideSidebarParam, hideToolbarParam],
  );
  const contextValue = useMemo(
    () => ({
      layout: effectiveLayout,
      setLayout,
    }),
    [effectiveLayout],
  );

  return (
    <LayoutContext.Provider value={contextValue}>
      {children}
    </LayoutContext.Provider>
  );
}
