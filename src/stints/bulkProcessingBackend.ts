import fs from "fs";
import readline from "readline";
import { BulkProcessor } from "./bulkProcessor";
import { IManifests, IProcessRaceStateData } from "./types";

export const bulkProcessFile = (manifests: IManifests, filename: string): Promise<IProcessRaceStateData> => {
  const processor = new BulkProcessor(manifests);
  const rl = readline.createInterface({
    input: fs.createReadStream(filename),
    terminal: false,
  });

  var result: IProcessRaceStateData;
  return new Promise((resolve, reject) => {
    rl.on("line", (line) => {
      // console.log(line);
      if (line.trim().length > 0) {
        const json = JSON.parse(line);
        // console.log(json);
        result = processor.process([json]);
      }
    });
    rl.on("close", () => {
      resolve(result);
    });
  });
};
