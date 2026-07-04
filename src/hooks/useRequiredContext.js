import { useContext } from "react";

export default function useRequiredContext(context, hookName, providerName) {
  const value = useContext(context);
  if (value == null) {
    throw new Error(`${hookName} must be used within ${providerName}`);
  }
  return value;
}
