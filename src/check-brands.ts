import fs from "fs";
import { readManifestsFromFile } from "./backend";
import { bulkProcessFile } from "./stints/bulkProcessingBackend";

// Note: May not work due to missing data. It just stays here as template.
const manifests = readManifestsFromFile("src/stints/__mockData__/brands-manifest.json");
bulkProcessFile(manifests, "src/stints/__mockData__/brands-states.txt").then((res) => {
  fs.writeFile("brands-result.json", JSON.stringify(res), (err) => {});
});
