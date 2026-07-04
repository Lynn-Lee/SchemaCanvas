import { SettingsContext } from "../context/SettingsContext";
import useRequiredContext from "./useRequiredContext";

export default function useSettings() {
  return useRequiredContext(
    SettingsContext,
    "useSettings",
    "SettingsContextProvider",
  );
}
