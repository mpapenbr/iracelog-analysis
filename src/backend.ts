import fs from "fs";
import { bulkProcessFile } from "./stints/bulkProcessingBackend";
import * as Types from "./stints/types";
import { createManifests } from "./stints/util";

export { bulkProcessFile, Types };

export const readManifestsFromFile = (filename: string): Types.IManifests => {
  // fs.open(filename, "r", (err,fd) => {})
  //  const rl = readline.createInterface({
  //    input: fs.createReadStream(filename),
  //    crlfDelay: Infinity,
  //  })
  //  var ret : IManifests
  //  rl.on('line', (line) => {
  //    ret = createManifests(JSON.parse(line))
  //  });

  const data = fs.readFileSync(filename, { encoding: "utf8", flag: "r" });
  // console.log(data);
  const jsonData = JSON.parse(data);
  return createManifests(Array.isArray(jsonData) ? jsonData[0] : jsonData);
};
