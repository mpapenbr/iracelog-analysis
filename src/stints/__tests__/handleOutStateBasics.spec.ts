import { readManifestsFromFile } from "../../backend";
import { bulkProcess } from "../bulkProcessing";
import { CarComputeState, defaultProcessRaceStateData } from "../types";

/**
 * This module contains basic tests about the carComputeState
 * Note: the important part is session[0] (=sessionTime) in combination with car[0] (=state)
 */
describe("handling OUT state", () => {
  const testManifestsFile = __dirname + "/../__mockData__/test-manifests.json";
  const manifests = readManifestsFromFile(testManifestsFile);
  const baseData = { ...defaultProcessRaceStateData };
  const emptyData = { type: 1, timestamp: 1, payload: { cars: [], pits: [], messages: [], session: [] } };
  const emptyPayload = { cars: [], pits: [], messages: [], session: [] };

  it("should mark the car as out-of-race on init RUN state", () => {
    // note: the important part is session[0] (=sessionTime)
    const data = [
      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [10, 3600, 10, "GREEN"],
          cars: [["RUN", "1", "D1a", "T1", "", "1", "1", "1", "0", "0", "0", "0"]],
        },
      },

      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [11, 3600, 10, "GREEN"],
          cars: [["OUT", "1", "D1a", "T1", "", "1", "1", "1", "0", "0", "0", "0"]],
        },
      },

      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [72, 3600, 10, "GREEN"],
          cars: [["OUT", "1", "D1a", "T1", "", "1", "1", "1", "0", "0", "0", "0"]],
        },
      },
    ];

    const expectResult = {
      carComputeState: [{ carNum: "1", outEncountered: 11, state: CarComputeState.OUT }],
    };
    const result = bulkProcess(manifests, data);

    expect(result).toMatchObject(expectResult);
  });
  it("should mark the car as out-of-race on init PIT state", () => {
    // note: the important part is session[0] (=sessionTime)
    const data = [
      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [9, 3600, 10, "GREEN"],
          cars: [["RUN", "1", "D1a", "T1", "", "1", "1", "1", "0", "0", "0", "0"]],
        },
      },
      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [10, 3600, 10, "GREEN"],
          cars: [["PIT", "1", "D1a", "T1", "", "1", "1", "1", "0", "0", "0", "0"]],
        },
      },

      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [11, 3600, 10, "GREEN"],
          cars: [["OUT", "1", "D1a", "T1", "", "1", "1", "1", "0", "0", "0", "0"]],
        },
      },

      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [72, 3600, 10, "GREEN"],
          cars: [["OUT", "1", "D1a", "T1", "", "1", "1", "1", "0", "0", "0", "0"]],
        },
      },
    ];

    const expectResult = {
      carComputeState: [{ carNum: "1", outEncountered: 11, state: CarComputeState.OUT }],
    };
    const result = bulkProcess(manifests, data);
    // console.log(result);
    expect(result).toMatchObject(expectResult);
  });

  it("should detect temporary OUT during RUN", () => {
    // note: the important part is session[0] (=sessionTime)
    const data = [
      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [10, 3600, 10, "GREEN"],
          cars: [["RUN", "1", "D1a", "T1", "", "1", "1", "1", "0", "0", "0", "0"]],
        },
      },

      // simulate OUT for 10s in car message
      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [11, 3600, 10, "GREEN"],
          cars: [["OUT", "1", "D1a", "T1", "", "1", "1", "1", "0", "0", "0", "0"]],
        },
      },

      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [22, 3600, 10, "GREEN"],
          cars: [["OUT", "1", "D1a", "T1", "", "1", "1", "1", "0", "0", "0", "0"]],
        },
      },

      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [23, 3600, 10, "GREEN"],
          cars: [["RUN", "1", "D1a", "T1", "", "1", "1", "1", "0", "0", "0", "0"]],
        },
      },
    ];

    const expectResult = {
      carStints: [
        {
          carNum: "1",
          current: {
            enterTime: 23,
            exitTime: 10,
            isCurrentStint: true,
          },
          history: [],
        },
      ],
      carComputeState: [{ carNum: "1", outEncountered: 0, state: CarComputeState.RUN }],
    };
    const result = bulkProcess(manifests, data);
    // console.log(JSON.stringify(result, null, 2));
    expect(result).toMatchObject(expectResult);
  });

  it("should detect temporary OUT during PIT", () => {
    // note: the important part is session[0] (=sessionTime)
    const data = [
      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [9, 3600, 10, "GREEN"],
          cars: [["RUN", "1", "D1a", "T1", "", "1", "1", "1", "0", "0", "0", "0"]],
        },
      },
      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [10, 3600, 10, "GREEN"],
          cars: [["PIT", "1", "D1a", "T1", "", "1", "1", "1", "0", "0", "0", "0"]],
        },
      },
      // simulate OUT for 10s in car message
      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [11, 3600, 10, "GREEN"],
          cars: [["OUT", "1", "D1a", "T1", "", "1", "1", "1", "0", "0", "0", "0"]],
        },
      },

      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [22, 3600, 10, "GREEN"],
          cars: [["OUT", "1", "D1a", "T1", "", "1", "1", "1", "0", "0", "0", "0"]],
        },
      },

      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [23, 3600, 10, "GREEN"],
          cars: [["PIT", "1", "D1a", "T1", "", "1", "1", "1", "0", "0", "0", "0"]],
        },
      },
    ];

    const expectResult = {
      carPits: [
        {
          carNum: "1",
          current: {
            enterTime: 10,
            exitTime: 23,
            isCurrentPitstop: true,
          },
          history: [],
        },
      ],
      carComputeState: [{ carNum: "1", outEncountered: 0, state: CarComputeState.PIT }],
    };
    const result = bulkProcess(manifests, data);
    // console.log(JSON.stringify(result, null, 2));
    expect(result).toMatchObject(expectResult);
  });

  it("should handle rejoin after OUT", async () => {
    // use case:
    // - car in RUN
    // - player has disconnet -> carMessage contains OUT
    // - player reconnects (car is in PIT then)
    // - player leaves pit
    const data = [
      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [10, 3600, 10, "GREEN"],
          cars: [["RUN", "1", "D1a", "T1", "", "1", "1", "1", "0", "0", "0", "0"]],
        },
      },
      // inital disconnect
      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [11, 3600, 10, "GREEN"],
          cars: [["OUT", "1", "D1a", "T1", "", "1", "1", "1", "0", "0", "0", "0"]],
        },
      },
      // triggers CarComputeState.OUT
      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [72, 3600, 10, "GREEN"],
          cars: [["OUT", "1", "D1a", "T1", "", "1", "1", "1", "0", "0", "0", "0"]],
        },
      },

      // simulate Reconnect - player is now in PIT
      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [80, 3600, 10, "GREEN"],
          cars: [["PIT", "1", "D1a", "T1", "", "1", "1", "1", "0", "0", "0", "0"]],
        },
      },

      // player continues the race
      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [81, 3600, 10, "GREEN"],
          cars: [["RUN", "1", "D1a", "T1", "", "1", "1", "1", "0", "0", "0", "0"]],
        },
      },

      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [90, 3600, 10, "GREEN"],
          cars: [["RUN", "1", "D1a", "T1", "", "1", "1", "1", "0", "0", "0", "0"]],
        },
      },
    ];

    const expectResult = {
      carStints: [
        {
          carNum: "1",
          current: {
            enterTime: 90,
            exitTime: 81,
            isCurrentStint: true,
          },
          history: [
            {
              exitTime: 10,
              enterTime: 72,
            },
          ],
        },
      ],
      carPits: [],
      carComputeState: [{ carNum: "1", outEncountered: 0, state: CarComputeState.RUN }],
    };
    const result = await bulkProcess(manifests, data);
    // console.log(JSON.stringify(result, null, 2));
    expect(result).toMatchObject(expectResult);
  });
});
