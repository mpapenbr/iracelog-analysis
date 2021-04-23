/**
 * contains computations for raceOrder
 */

import { IManifests } from "./types";
import { getValueViaSpec } from "./util";

export const processForRaceOrder = (manifests: IManifests, newData: [][]): string[] => {
  return newData.map((carEntry) => {
    const currentCarNum = getValueViaSpec(carEntry, manifests.car, "carNum");
    return currentCarNum;
  });
};
