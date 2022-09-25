import { processForRaceGraph } from "./raceGraph";
import { processForRaceOrder } from "./raceOrder";
import {
  CarComputeState,
  defaultPitInfo,
  defaultStintInfo,
  ICarComputeState,
  ICarInfo,
  ICarLaps,
  ICarPitInfo,
  ICarStintInfo,
  IManifests,
  IMessage,
  IPitInfo,
  IProcessRaceStateData,
  IRaceGraph,
} from "./types";
import { getValueViaSpec } from "./util";
export class BulkProcessor {
  private carStintsLookup = new Map<string, ICarStintInfo>();
  private carPitsLookup = new Map<string, ICarPitInfo>();
  private carComputeState = new Map<string, ICarComputeState>();
  private carInfo = new Map<string, ICarInfo>();
  private carLaps = new Map<string, ICarLaps>();
  private raceOrder = [] as string[];
  private raceGraph = [] as IRaceGraph[];
  private infoMsg = [] as IMessage[];

  private manifests: IManifests;

  // private manifests: IManifests = { car: [], pit: [], message: [], session: [] };
  constructor(manifests: IManifests, currentData?: IProcessRaceStateData) {
    this.manifests = manifests;
    if (currentData) {
      currentData.carStints.forEach((v) => this.carStintsLookup.set(v.carNum, v));
      currentData.carPits.forEach((v) => this.carPitsLookup.set(v.carNum, v));
      currentData.carComputeState.forEach((v) => this.carComputeState.set(v.carNum, v));
      currentData.carInfo.forEach((v) => this.carInfo.set(v.carNum, v));
      currentData.carLaps.forEach((v) => this.carLaps.set(v.carNum, v));
      this.infoMsg = currentData.infoMsgs;
      this.raceGraph = currentData.raceGraph;
    }
  }

  /**
   * process a bunch or messages (in json )
   */
  public process(jsonItems: any[]): IProcessRaceStateData {
    var lastSessionMsg;
    var lastCarMsg;

    jsonItems.forEach((m) => {
      this.processOneJsonItem(m);
      lastSessionMsg = { msgType: m.msgType, timestamp: m.timestamp, data: m.payload.session };
      lastCarMsg = { msgType: m.msgType, timestamp: m.timestamp, data: m.payload.cars };
    });
    // reversing needs to be done by caller
    // this.infoMsg.reverse(); // want the last recieved message on top
    return {
      carStints: Array.from(this.carStintsLookup.values()),
      carPits: Array.from(this.carPitsLookup.values()),
      carComputeState: Array.from(this.carComputeState.values()),
      carInfo: Array.from(this.carInfo.values()),
      carLaps: Array.from(this.carLaps.values()),
      raceOrder: this.raceOrder,
      raceGraph: this.raceGraph,
      session: lastSessionMsg,
      cars: lastCarMsg,
      infoMsgs: this.infoMsg,
    };
  }

  private processOneJsonItem(m: any) {
    const carsData = m.payload.cars;
    carsData.forEach((carEntry: []) => {
      const currentCarNum = getValueViaSpec(carEntry, this.manifests.car, "carNum");
      if (!this.carComputeState.has(currentCarNum)) {
        this.carComputeState.set(currentCarNum, {
          carNum: currentCarNum,
          state: CarComputeState.INIT,
          outEncountered: 0,
        });
      }
    });

    const sessionTime = getValueViaSpec(m.payload.session, this.manifests.session, "sessionTime");
    carsData.forEach((carEntry: []) => {
      this.processStintAndPit(carEntry, sessionTime);
      this.processDriverAndTeam(carEntry, sessionTime);
    });

    this.raceOrder = processForRaceOrder(this.manifests, carsData);
    this.raceGraph = processForRaceGraph(this.manifests, this.carComputeState, this.raceGraph, carsData);

    this.processForLapGraph(carsData);

    if (m.payload.messages?.length > 0)
      this.infoMsg.push({ msgType: 1, timestamp: m.timestamp, data: m.payload.messages });
  }

  private processForLapGraph(newData: [][]) {
    newData.forEach((carEntry) => {
      const currentCarNum = getValueViaSpec(carEntry, this.manifests.car, "carNum");
      const currentCarLap = getValueViaSpec(carEntry, this.manifests.car, "lc");
      const currentCarLapTimeRaw = getValueViaSpec(carEntry, this.manifests.car, "last");
      const currentCarLapTime = Array.isArray(currentCarLapTimeRaw) ? currentCarLapTimeRaw[0] : currentCarLapTimeRaw;
      if (currentCarLap < 1) return;
      let found = this.carLaps.get(currentCarNum);
      if (found === undefined) {
        found = { carNum: currentCarNum, laps: [] };
        this.carLaps.set(currentCarNum, found);
      }
      let foundLap = found.laps.find((v) => v.lapNo === currentCarLap);
      if (foundLap === undefined) {
        found.laps = [...found.laps, { lapNo: currentCarLap, lapTime: currentCarLapTime }];
      } else {
        found.laps = [...found.laps.slice(0, -1), { lapNo: currentCarLap, lapTime: currentCarLapTime }];
      }
    });
  }

  private processDriverAndTeam(carEntry: [], sessionTime: number) {
    const currentCarNum = getValueViaSpec(carEntry, this.manifests.car, "carNum");
    const currentTeamName = getValueViaSpec(carEntry, this.manifests.car, "teamName");
    const currentDriverName = getValueViaSpec(carEntry, this.manifests.car, "userName");
    const ccs = this.carComputeState.get(currentCarNum)!;

    // no more processing if car is in state out
    if (ccs.state === CarComputeState.OUT) {
      return;
    }
    const newDriverEntry = () => ({
      driverName: currentDriverName,
      seatTime: [{ enterCarTime: sessionTime, leaveCarTime: sessionTime }],
    });
    let csEntry = this.carInfo.get(currentCarNum);
    if (csEntry === undefined) {
      let currentEntry = newDriverEntry();
      csEntry = {
        carNum: currentCarNum,
        name: currentTeamName ?? currentDriverName,
        carClass: getValueViaSpec(carEntry, this.manifests.car, "carClass"),
        drivers: [currentEntry],
        current: newDriverEntry(),
      };
      this.carInfo.set(currentCarNum, csEntry);
    } else {
      const cur = csEntry.drivers.find((d) => d.driverName === currentDriverName);
      if (cur === undefined) {
        csEntry.drivers.push(newDriverEntry());
        csEntry.current = newDriverEntry();
      } else {
        if (csEntry.current.driverName === currentDriverName) {
          csEntry.current.seatTime[csEntry.current.seatTime.length - 1].leaveCarTime = sessionTime;
          cur.seatTime[cur.seatTime.length - 1].leaveCarTime = sessionTime;
        } else {
          const tmp = { ...cur };
          tmp.seatTime.push({ enterCarTime: sessionTime, leaveCarTime: sessionTime });
          csEntry.current = tmp;
        }
      }
    }
  }
  private processStintAndPit(carEntry: [], sessionTime: number) {
    const OUT_THRESHOLD = 60; // after this number of seconds of continouus OUT state (via manifest) the car is considered out-of-race
    const currentCarNum = getValueViaSpec(carEntry, this.manifests.car, "carNum");
    const currentCarLap = getValueViaSpec(carEntry, this.manifests.car, "lap");
    const currentCarState = getValueViaSpec(carEntry, this.manifests.car, "state");
    if (currentCarLap < 1) return;

    const ccs = this.carComputeState.get(currentCarNum)!;
    // console.log(`${sessionTime}-${currentCarNum}-${ccs.state} `);
    switch (ccs.state) {
      case CarComputeState.INIT:
        {
          switch (currentCarState) {
            case "RUN":
              const newEntry: ICarStintInfo = {
                carNum: currentCarNum,
                current: {
                  ...defaultStintInfo,
                  carNum: currentCarNum,
                  exitTime: sessionTime,
                  lapExit: currentCarLap,
                  isCurrentStint: true,
                },
                history: [],
              };
              this.carStintsLookup.set(currentCarNum, newEntry);
              ccs.state = CarComputeState.RUN;

              break;

            case "PIT":
              break;
            default:
              break; // do nothing
          }
        }
        break;
      case CarComputeState.RUN:
        {
          const stint = this.carStintsLookup.get(currentCarNum)!;

          stint.current.enterTime = sessionTime;
          stint.current.lapEnter = currentCarLap;
          stint.current.numLaps = currentCarLap - stint.current.lapExit + 1;
          stint.current.stintTime = sessionTime - stint.current.exitTime;
          switch (currentCarState) {
            case "RUN":
              ccs.outEncountered = 0; // reset possible out-of-race state
              break;
            case "OUT":
              // we keep the original state for at least OUT_THRESHOLD seconds. After that the car is considered out-of-race.
              if (ccs.outEncountered === 0) {
                ccs.outEncountered = sessionTime;
              } else {
                if (sessionTime - ccs.outEncountered > OUT_THRESHOLD) {
                  // car seems to be out of race.
                  // console.log("RUN: moving to out??? session:" + sessionTime + "- outEnc: " + ccs.outEncountered);
                  ccs.state = CarComputeState.OUT;
                  stint.current.isCurrentStint = false;
                  stint.history.push({ ...stint.current });
                }
              }

              // console.log("surprise - got OUT state for " + currentCarNum + " in state RUN");
              break;

            case "PIT":
              ccs.outEncountered = 0;
              stint.current.isCurrentStint = false;
              stint.history.push({ ...stint.current });
              ccs.state = CarComputeState.PIT;

              const newPitEntry: IPitInfo = {
                ...defaultPitInfo,
                carNum: currentCarNum,
                lapEnter: currentCarLap,
                enterTime: sessionTime,
                isCurrentPitstop: true,
              };
              let carPitEntry = this.carPitsLookup.get(currentCarNum);
              if (carPitEntry === undefined) {
                this.carPitsLookup.set(currentCarNum, { carNum: currentCarNum, current: newPitEntry, history: [] });
              } else {
                carPitEntry.current = newPitEntry;
              }

              break;
          }
        }
        break;
      case CarComputeState.PIT: {
        const carPitEntry = this.carPitsLookup.get(currentCarNum)!;
        carPitEntry.current.exitTime = sessionTime;
        carPitEntry.current.lapExit = currentCarLap;
        carPitEntry.current.laneTime = sessionTime - carPitEntry.current.enterTime;
        switch (currentCarState) {
          case "RUN":
            ccs.outEncountered = 0;
            carPitEntry.current.isCurrentPitstop = false;
            carPitEntry.history.push(carPitEntry.current);

            const x = this.carStintsLookup.get(currentCarNum)!;
            x.current = {
              ...defaultStintInfo,
              carNum: currentCarNum,
              exitTime: sessionTime,
              lapExit: currentCarLap,
              isCurrentStint: true,
            };
            ccs.state = CarComputeState.RUN;
            break;
          case "OUT":
            // we keep the original state for at least OUT_THRESHOLD seconds. After that the car is considered out-of-race.
            if (ccs.outEncountered === 0) {
              ccs.outEncountered = sessionTime;
            } else {
              if (sessionTime - ccs.outEncountered > OUT_THRESHOLD) {
                // car seems to be out of race.
                //console.log("moving to out??? session:" + sessionTime + "- outEnc: " + ccs.outEncountered);
                ccs.state = CarComputeState.OUT;
              }
            }
            break;

          case "PIT":
            ccs.outEncountered = 0;
            break;
        }
        break;
      }
      case CarComputeState.OUT:
        switch (currentCarState) {
          case "RUN":
            {
              const x = this.carStintsLookup.get(currentCarNum)!;
              x.current = {
                ...defaultStintInfo,
                carNum: currentCarNum,
                exitTime: sessionTime,
                lapExit: currentCarLap,
                isCurrentStint: true,
              };
              ccs.state = CarComputeState.RUN;
            }
            break;
          case "PIT":
            // PIT in currentCarState would indicate "driver entered the car again". Process this as "normal" pit stop (makes life easier)
            const newPitEntry: IPitInfo = {
              ...defaultPitInfo,
              carNum: currentCarNum,
              lapEnter: currentCarLap,
              enterTime: sessionTime,
              isCurrentPitstop: true,
            };
            let carPitEntry = this.carPitsLookup.get(currentCarNum);
            if (carPitEntry === undefined) {
              this.carPitsLookup.set(currentCarNum, { carNum: currentCarNum, current: newPitEntry, history: [] });
            } else {
              carPitEntry.current = newPitEntry;
            }
            ccs.state = CarComputeState.PIT;
            break;
        }
    }
  }
}
export const bulkProcess = (manifests: IManifests, jsonItems: any[]): IProcessRaceStateData => {
  const processor = new BulkProcessor(manifests);
  return processor.process(jsonItems);
};
