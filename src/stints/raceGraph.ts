/**
 * contains computations for raceGraph
 */

import _ from "lodash";
import { ICarInfo, IManifests, IProcessRaceStateData, IRaceGraph } from "./types";
import { getValueViaSpec } from "./util";

export const processForRaceGraph = (
  current: IProcessRaceStateData,
  manifests: IManifests,
  currentRaceGraph: IRaceGraph[],
  newData: [][]
): IRaceGraph[] => {
  const leaderEntry = newData.find((dataRow) => getValueViaSpec(dataRow, manifests.car, "pos") === 1);
  if (leaderEntry === undefined) return current.raceGraph;
  let work = [...currentRaceGraph];
  const picLookup = computePicLookup(manifests, newData);
  work = processForRaceGraphForOverall(manifests, newData, work, picLookup);
  work = processForRaceGraphForClass(manifests, newData, work, picLookup);
  return work;
};

/**
 * a class position may be 0 (didn't check but this may be related to certain pitstop situations)
 */
const computePicLookup = (manifests: IManifests, newData: [][]) => {
  const belongsToCarClass = (dataRow: [], carClass: string): boolean => {
    return (getValueViaSpec(dataRow, manifests.car, "carClass") as string).localeCompare(carClass) === 0;
  };
  let picLookup = new Map<string, number>();
  const carClasses = computeCarClasses(manifests, newData);
  if (carClasses.length > 0) {
    carClasses.forEach((curCarClass) => {
      const classResorted = newData
        .filter((dataRow) => belongsToCarClass(dataRow, curCarClass))
        .map((dataRow) => {
          const pic = getValueViaSpec(dataRow, manifests.car, "pic");
          const carNum = getValueViaSpec(dataRow, manifests.car, "carNum");
          return { carNum: carNum, pic: pic };
        })
        .sort((a, b) => a.pic - b.pic);
      classResorted.forEach((v, idx) => {
        picLookup.set(v.carNum, idx + 1);
      });
    });
  } else {
    const resorted = newData
      .map((dataRow) => {
        const pic = getValueViaSpec(dataRow, manifests.car, "pic");
        const carNum = getValueViaSpec(dataRow, manifests.car, "carNum");
        return { carNum: carNum, pic: pic };
      })
      .sort((a, b) => a.pic - b.pic);
    resorted.forEach((v, idx) => {
      picLookup.set(v.carNum, idx + 1);
    });
  }

  return picLookup;
};

export const processForRaceGraphForOverall = (
  manifests: IManifests,
  newData: [][],
  currentRaceGraph: IRaceGraph[],
  picLookup: Map<string, number>
): IRaceGraph[] => {
  const leaderEntry = newData.find((dataRow) => getValueViaSpec(dataRow, manifests.car, "pos") === 1);
  if (leaderEntry === undefined) return currentRaceGraph;

  const leaderLap = getValueViaSpec(leaderEntry, manifests.car, "lc");
  const foundIdx = currentRaceGraph.findIndex((v) => v.lapNo === leaderLap);
  const newLapEntry: IRaceGraph = {
    carClass: "overall",
    lapNo: getValueViaSpec(leaderEntry, manifests.car, "lc"),
    gaps: newData.map((carEntry) => ({
      gap: getValueViaSpec(carEntry, manifests.car, "gap"),
      lapNo: getValueViaSpec(carEntry, manifests.car, "lc"),
      carNum: getValueViaSpec(carEntry, manifests.car, "carNum"),
      pos: getValueViaSpec(carEntry, manifests.car, "pos"),
      pic: picLookup.get(getValueViaSpec(carEntry, manifests.car, "carNum"))!,
    })),
  };
  if (foundIdx === -1) {
    return [...currentRaceGraph, newLapEntry];
  } else {
    currentRaceGraph.splice(foundIdx, 1, newLapEntry);
    return [...currentRaceGraph];
    // return [...currentRaceGraph.slice(0, -1), newLapEntry];
  }
};

const computeCarClassesX = (carInfos: ICarInfo[]) => {
  return _.uniq(carInfos.filter((v) => "".localeCompare(v.carClass || "") !== 0).map((v) => v.carClass)).sort();
};

const computeCarClasses = (manifests: IManifests, data: [][]) => {
  return _.uniq(
    data
      .map((dataRow) => getValueViaSpec(dataRow, manifests.car, "carClass") as string)
      .filter((v) => (v || "").localeCompare("") !== 0)
  ).sort();
};

const processForRaceGraphForClass = (
  manifests: IManifests,
  newData: [][],
  currentRaceGraph: IRaceGraph[],
  picLookup: Map<string, number>
): IRaceGraph[] => {
  const carClasses = computeCarClasses(manifests, newData);
  if (carClasses.length === 0) return currentRaceGraph;

  let carClassAdditions = [...currentRaceGraph];
  carClasses.forEach((currentCarClass) => {
    carClassAdditions = internalProcessForRaceGraphForClass(
      manifests,
      newData,
      carClassAdditions,
      currentCarClass,
      picLookup
    );
  });
  return carClassAdditions;
};

const internalProcessForRaceGraphForClass = (
  manifests: IManifests,
  newData: [][],
  currentRaceGraph: IRaceGraph[],
  currentCarClass: string,
  picLookup: Map<string, number>
): IRaceGraph[] => {
  const belongsToCarClass = (dataRow: []): boolean => {
    return (getValueViaSpec(dataRow, manifests.car, "carClass") as string).localeCompare(currentCarClass) === 0;
  };

  const leaderEntry = newData
    .filter((dataRow) => belongsToCarClass(dataRow))
    .reduce((cur, prev) => {
      const a = getValueViaSpec(cur, manifests.car, "pic");
      const b = getValueViaSpec(prev, manifests.car, "pic");
      return a < b ? cur : prev;
    });
  if (leaderEntry === undefined) return currentRaceGraph;

  const leaderLap = getValueViaSpec(leaderEntry, manifests.car, "lc");
  const foundIdx = currentRaceGraph.findIndex(
    (v) => v.lapNo === leaderLap && v.carClass.localeCompare(currentCarClass) === 0
  );
  const newLapEntry: IRaceGraph = {
    carClass: currentCarClass,
    lapNo: getValueViaSpec(leaderEntry, manifests.car, "lc"),
    gaps: newData
      .filter((carEntry) => belongsToCarClass(carEntry))
      .map((carEntry) => ({
        gap: getValueViaSpec(carEntry, manifests.car, "gap") - getValueViaSpec(leaderEntry, manifests.car, "gap"),
        lapNo: getValueViaSpec(carEntry, manifests.car, "lc"),
        carNum: getValueViaSpec(carEntry, manifests.car, "carNum"),
        pos: getValueViaSpec(carEntry, manifests.car, "pos"),
        pic: picLookup.get(getValueViaSpec(carEntry, manifests.car, "carNum"))!,
      })),
  };
  if (foundIdx === -1) {
    return [...currentRaceGraph, newLapEntry];
  } else {
    currentRaceGraph.splice(foundIdx, 1, newLapEntry);
    return [...currentRaceGraph];
  }
};
