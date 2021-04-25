import { BulkProcessor } from "./bulkProcessor";
import { IManifests, IProcessRaceStateData } from "./types";

export const bulkProcess = (
  current: IProcessRaceStateData,
  manifests: IManifests,
  jsonItems: any[]
): IProcessRaceStateData => {
  const processor = new BulkProcessor(manifests);
  return processor.process(current, jsonItems);
};
