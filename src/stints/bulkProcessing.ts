import { BulkProcessor } from "./bulkProcessor";
import { IManifests, IProcessRaceStateData } from "./types";

export const bulkProcess = (manifests: IManifests, jsonItems: any[]): IProcessRaceStateData => {
  const processor = new BulkProcessor(manifests);
  return processor.process(jsonItems);
};
