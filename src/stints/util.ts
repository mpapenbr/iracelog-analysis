import fs from "fs";
import _ from "lodash";
import { IDataEntrySpec, IManifests } from "./types";

export const getValueViaSpec = (data: [], spec: IDataEntrySpec[], key: string): any => {
  const idx = spec.findIndex((v) => v.name === key);
  if (idx < 0) {
    return undefined;
  } else {
    return data[idx];
  }
};

interface IShortManifest {
  car: string[];
  session: string[];
  pit: string[];
  message: string[];
}
export const createManifests = (data: IShortManifest): IManifests => {
  const toDataSpec = (d: string[]): IDataEntrySpec[] => d.map((v) => ({ name: v, type: "string" }));
  return {
    car: toDataSpec(data.car),
    session: toDataSpec(data.session),
    pit: toDataSpec(data.pit),
    message: toDataSpec(data.message),
  };
};

export const readManifestsFromFile = (filename: string): IManifests => {
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
  return createManifests(_.isArray(jsonData) ? jsonData[0] : jsonData);
};
