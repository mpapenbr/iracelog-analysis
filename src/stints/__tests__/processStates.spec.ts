import { readManifestsFromFile } from "../../backend";
import { bulkProcess } from "../bulkProcessing";
import { bulkProcessFile } from "../bulkProcessingBackend";
import { BulkProcessor } from "../bulkProcessor";
import { defaultProcessRaceStateData } from "../types";

describe("process test messages", () => {
  const testManifestsFile = __dirname + "/../__mockData__/test-manifests.json";
  const testDataFile = __dirname + "/../__mockData__/sample-json-data.txt";
  const manifests = readManifestsFromFile(testManifestsFile);
  const baseData = { ...defaultProcessRaceStateData };
  const emptyData = { type: 1, timestamp: 1, payload: { cars: [], pits: [], messages: [], session: [] } };
  const emptyPayload = { cars: [], pits: [], messages: [], session: [] };
  const data = [
    {
      ...emptyData,
      payload: {
        ...emptyPayload,
        session: [10, 3600, 10, "GREEN"],
        cars: [
          ["RUN", "1", "D1a", "T1", "", "1", "1", "1", "0", "0", "0", "0"],
          ["RUN", "2", "D2", "T2", "", "2", "2", "1", "0", "0", "0", "0"],
        ],
      },
    },
    {
      ...emptyData,
      payload: {
        ...emptyPayload,
        session: [20, 3600, 10, "GREEN"],
        cars: [
          ["RUN", "1", "D1b", "T1", "", "1", "1", "1", "0", "0", "0", "0"],
          ["RUN", "2", "D2", "T2", "", "2", "2", "1", "0", "0", "0", "0"],
        ],
      },
    },
    {
      ...emptyData,
      payload: {
        ...emptyPayload,
        session: [30, 3600, 10, "GREEN"],
        cars: [
          ["RUN", "1", "D1a", "T1", "", "1", "1", "1", "0", "0", "0", "0"],
          ["RUN", "2", "D2", "T2", "", "2", "2", "1", "0", "0", "0", "0"],
        ],
      },
    },
  ];

  const expectResult = {
    raceOrder: ["1", "2"],
    carInfo: [
      {
        carNum: "1",
        carClass: "",
        name: "T1",
        current: {
          driverName: "D1a",
          seatTime: [
            { enterCarTime: 10, leaveCarTime: 10 },
            { enterCarTime: 30, leaveCarTime: 30 },
          ],
        },
        drivers: [
          {
            driverName: "D1a",
            seatTime: [
              { enterCarTime: 10, leaveCarTime: 10 },
              { enterCarTime: 30, leaveCarTime: 30 },
            ],
          },
          { driverName: "D1b", seatTime: [{ enterCarTime: 20, leaveCarTime: 20 }] },
        ],
      },
      {
        carNum: "2",
        carClass: "",
        name: "T2",
        current: { driverName: "D2", seatTime: [{ enterCarTime: 10, leaveCarTime: 30 }] },
        drivers: [
          {
            driverName: "D2",
            seatTime: [{ enterCarTime: 10, leaveCarTime: 30 }],
          },
        ],
      },
    ],
  };

  it("should handle empty json", () => {
    expect(bulkProcess(baseData, manifests, [])).toMatchObject(defaultProcessRaceStateData);
  });

  it("should process with json data array", () => {
    const result = bulkProcess(baseData, manifests, data);
    expect(result).toMatchObject(expectResult);
  });

  it("should process with single json calls", () => {
    const processor = new BulkProcessor(manifests);
    let result = baseData;
    data.forEach((d) => (result = processor.process(result, [d])));
    expect(result).toMatchObject(expectResult);
  });

  it("should process with data from file", () => {
    const result = bulkProcessFile(baseData, manifests, testDataFile);
    var check;
    result.then((d) => {
      expect(d).toMatchObject(expectResult);
    });
  });
});
