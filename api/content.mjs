import { snapshotHandler } from "../server/drive-snapshot.mjs";
import { validatePublicSnapshot } from "../src/data/public-contract.mjs";

export default snapshotHandler({
  fileVariable: "CONTENT_PUBLIC_FILE_ID",
  validate: validatePublicSnapshot,
  error: "公開機構、課程、公告與招募暫時無法同步",
  optional: true,
});
