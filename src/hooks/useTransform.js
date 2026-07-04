import { TransformContext } from "../context/TransformContext";
import useRequiredContext from "./useRequiredContext";

export default function useTransform() {
  return useRequiredContext(
    TransformContext,
    "useTransform",
    "TransformContextProvider",
  );
}
