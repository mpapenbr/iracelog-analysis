import { processForRaceGraph } from "./raceGraph";
import { processForRaceOrder } from "./raceOrder";
import {
  CarComputeState,
  defaultPitInfo,
  defaultProcessRaceStateData,
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

class BulkProcessor {
  private carStintsLookup = new Map<string, ICarStintInfo>();
  private carPitsLookup = new Map<string, ICarPitInfo>();
  private carComputeState = new Map<string, ICarComputeState>();
  private carInfo = new Map<string, ICarInfo>();
  private carLaps = new Map<string, ICarLaps>();
  private raceOrder = [] as string[];
  private raceGraph = [] as IRaceGraph[];
  private infoMsg = [] as IMessage[];
  private current: IProcessRaceStateData = { ...defaultProcessRaceStateData };
  private manifests: IManifests = { car: [], pit: [], message: [], session: [] };
  constructor() {}

  /**
   * process
   */
  public process(current: IProcessRaceStateData, manifests: IManifests, jsonItems: any[]): IProcessRaceStateData {
    this.current = current;
    var lastSessionMsg;
    var lastCarMsg;
    this.manifests = manifests;

    jsonItems.forEach((m) => {
      const carsData = m.cars;
      carsData.forEach((carEntry: []) => {
        const currentCarNum = getValueViaSpec(carEntry, this.manifests.car, "carNum");
        if (!this.carComputeState.has(currentCarNum)) {
          this.carComputeState.set(currentCarNum, {
            carNum: currentCarNum,
            state: CarComputeState.INIT,
          });
        }
      });

      const sessionTime = getValueViaSpec(m.session, this.manifests.session, "sessionTime");
      carsData.forEach((carEntry: []) => {
        this.processDriverAndTeam(carEntry, sessionTime);
        this.processStintAndPit(carEntry, sessionTime);
      });
      this.raceOrder = processForRaceOrder(this.manifests, carsData);
      this.raceGraph = processForRaceGraph(this.current, this.manifests, this.raceGraph, carsData);
      this.processForLapGraph(this.current, carsData);
      if (m.messages.length > 0) this.infoMsg.push(...m.messages);
      lastSessionMsg = { msgType: m.msgType, timestamp: m.timestamp, data: m.session };
      lastCarMsg = { msgType: m.msgType, timestamp: m.timestamp, data: carsData };
    });
    this.infoMsg.reverse(); // want the last recieved message on top
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

  private processForLapGraph(current: IProcessRaceStateData, newData: [][]) {
    newData.forEach((carEntry) => {
      const currentCarNum = getValueViaSpec(carEntry, this.manifests.car, "carNum");
      const currentCarLap = getValueViaSpec(carEntry, this.manifests.car, "lc");
      const currentCarLapTime = getValueViaSpec(carEntry, this.manifests.car, "last");
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

    const newDriverEntry = () => ({
      driverName: currentDriverName,
      seatTime: [{ enterCarTime: sessionTime, leaveCarTime: sessionTime }],
    });
    let csEntry = this.carInfo.get(currentCarNum);
    if (csEntry === undefined) {
      let currentEntry = newDriverEntry();
      csEntry = {
        carNum: currentCarNum,
        name: currentTeamName,
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
    const currentCarNum = getValueViaSpec(carEntry, this.manifests.car, "carNum");
    const currentCarLap = getValueViaSpec(carEntry, this.manifests.car, "lap");
    const currentCarState = getValueViaSpec(carEntry, this.manifests.car, "state");
    if (currentCarLap < 1) return;

    const ccs = this.carComputeState.get(currentCarNum)!;
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
          const x = this.carStintsLookup.get(currentCarNum)!;
          x.current.enterTime = sessionTime;
          x.current.lapEnter = currentCarLap;
          x.current.numLaps = currentCarLap - x.current.lapExit + 1;
          x.current.stintTime = sessionTime - x.current.exitTime;
          switch (currentCarState) {
            case "RUN":
              break;
            case "OUT":
              console.log("surprise - got OUT state for " + currentCarNum + " in state RUN");
              break;
            case "PIT":
              x.current.isCurrentStint = false;
              x.history.push({ ...x.current });
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

          case "PIT":
            break;
        }
      }
    }
  }
}
export const bulkProcess = (
  current: IProcessRaceStateData,
  manifests: IManifests,
  jsonItems: any[]
): IProcessRaceStateData => {
  const processor = new BulkProcessor();
  return processor.process(current, manifests, jsonItems);
};