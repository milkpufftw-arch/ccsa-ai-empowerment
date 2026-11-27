import { snapshotHandler } from "../server/drive-snapshot.mjs";
import { validateLibrarySnapshot } from "../src/data/library-contract.mjs";

export default snapshotHandler({
  fileVariable: "LIBRARY_PUBLIC_FILE_ID",
  validate: validateLibrarySnapshot,
  error: "公開成果與資源暫時無法同步",
});
