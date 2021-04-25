import fs from "fs";
import { readManifestsFromFile } from "./backend";
import { bulkProcessFile } from "./stints/bulkProcessingBackend";
import { defaultProcessRaceStateData } from "./stints/types";

const manifests = readManifestsFromFile("manifest-neo.json");
bulkProcessFile({ ...defaultProcessRaceStateData }, manifests, "data-neo.json").then((res) => {
  fs.writeFile("neo-result.json", JSON.stringify(res), (err) => {});
});
