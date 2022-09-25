import { readManifestsFromFile } from "../../backend";
import { bulkProcess } from "../bulkProcessing";
import { bulkProcessFile } from "../bulkProcessingBackend";
import { BulkProcessor } from "../bulkProcessor";
import { defaultProcessRaceStateData } from "../types";

describe("process test messages (single driver, no car classes)", () => {
  const testManifestsFile = __dirname + "/../__mockData__/test-manifests-0.5.0-no-team.json";
  const testDataFile = __dirname + "/../__mockData__/sample-json-data-0.5.0-no-team.txt";
  const manifests = readManifestsFromFile(testManifestsFile);
  const baseData = { ...defaultProcessRaceStateData };
  const emptyData = { type: 1, timestamp: 1, payload: { cars: [], pits: [], messages: [], session: [] } };
  const emptyPayload = { cars: [], pits: [], messages: [], session: [] };
  const data = [
    {
      ...emptyData,
      timestamp: 1616259562,
      payload: {
        ...emptyPayload,
        session: [10, 3600, 10, "GREEN"],
        cars: [
          ["RUN", "1", "D1", "1", "1", "1", "0", "0", "0", "0"],
          ["RUN", "2", "D2", "2", "2", "1", "0", "0", "0", "0"],
        ],
        messages: [
          ["Pits", "Enter", "1", null, "#1 enter"],
          ["Pits", "Enter", "2", null, "#2 enter"],
        ],
      },
    },
    {
      ...emptyData,
      timestamp: 1616259563,
      payload: {
        ...emptyPayload,
        session: [20, 3600, 10, "GREEN"],
        cars: [
          ["RUN", "1", "D1", "1", "1", "1", "0", "0", "0", "0"],
          ["RUN", "2", "D2", "2", "2", "1", "0", "0", "0", "0"],
        ],
        messages: [["Pits", "Exit", "1", null, "#1 exit"]],
      },
    },
    {
      ...emptyData,
      timestamp: 1616259564,
      payload: {
        ...emptyPayload,
        session: [30, 3600, 10, "GREEN"],
        cars: [
          ["RUN", "1", "D1", "1", "1", "1", "0", "0", "0", "0"],
          ["RUN", "2", "D2", "2", "2", "1", "0", "0", "0", "0"],
        ],
      },
    },
  ];

  const expectResult = {
    raceOrder: ["1", "2"],
    carInfo: [
      {
        carNum: "1",
        carClass: undefined,
        name: "D1",
        current: {
          driverName: "D1",
          seatTime: [{ enterCarTime: 10, leaveCarTime: 30 }],
        },
        drivers: [
          {
            driverName: "D1",
            seatTime: [{ enterCarTime: 10, leaveCarTime: 30 }],
          },
        ],
      },
      {
        carNum: "2",
        carClass: undefined,
        name: "D2",
        current: { driverName: "D2", seatTime: [{ enterCarTime: 10, leaveCarTime: 30 }] },
        drivers: [
          {
            driverName: "D2",
            seatTime: [{ enterCarTime: 10, leaveCarTime: 30 }],
          },
        ],
      },
    ],
    infoMsgs: [
      {
        timestamp: 1616259562,
        msgType: 1,
        data: [
          ["Pits", "Enter", "1", null, "#1 enter"],
          ["Pits", "Enter", "2", null, "#2 enter"],
        ],
      },
      { timestamp: 1616259563, msgType: 1, data: [["Pits", "Exit", "1", null, "#1 exit"]] },
    ],
  };

  it("should handle empty json", () => {
    expect(bulkProcess(manifests, [])).toMatchObject(defaultProcessRaceStateData);
  });

  it("should process with json data array", () => {
    const result = bulkProcess(manifests, data);
    expect(result).toMatchObject(expectResult);
  });

  it("should process with single json calls", () => {
    const processor = new BulkProcessor(manifests);
    let result = baseData;
    data.forEach((d) => (result = processor.process([d])));
    expect(result).toMatchObject(expectResult);
  });

  it("should process with data from file", () => {
    const result = bulkProcessFile(manifests, testDataFile);
    var check;
    result.then((d) => {
      expect(d).toMatchObject(expectResult);
    });
  });
});
