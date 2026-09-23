import { Composition, registerRoot } from "remotion";
import { CATEGORY_IMAGE_SETS, type JobPreviewCategory } from "../lib/job-preview-config";
import { CategoryPreview, PREVIEW } from "./CategoryPreview";

function Root() {
  return <>{(Object.keys(CATEGORY_IMAGE_SETS) as JobPreviewCategory[]).flatMap(category =>
    ([1, 2] as const).map(variant => <Composition key={`${category}-${variant}`} id={`${category}-${variant}`}
      component={CategoryPreview} defaultProps={{ category, variant }} {...PREVIEW} />))}</>;
}
registerRoot(Root);
