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
