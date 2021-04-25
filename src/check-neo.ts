import fs from "fs";
import { bulkProcessFile } from "./stints/bulkProcessing";
import { defaultProcessRaceStateData } from "./stints/types";
import { readManifestsFromFile } from "./stints/util";

const manifests = readManifestsFromFile("manifest-neo.json");
bulkProcessFile({ ...defaultProcessRaceStateData }, manifests, "data-neo.json").then((res) => {
  fs.writeFile("neo-result.json", JSON.stringify(res), (err) => {});
});
