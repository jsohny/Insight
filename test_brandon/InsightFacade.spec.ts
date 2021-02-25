import { expect } from "chai";
import * as chai from "chai";
import * as fs from "fs-extra";
import * as chaiAsPromised from "chai-as-promised";
import { InsightDatasetKind } from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import { InsightError } from "../src/controller/IInsightFacade";
import { NotFoundError } from "../src/controller/IInsightFacade";
import { ResultTooLargeError } from "../src/controller/IInsightFacade";
import { InsightDataset } from "../src/controller/IInsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";

// This extends chai with assertions that natively support Promises
chai.use(chaiAsPromised);

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any; // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string; // This is injected when reading the file
}

describe("InsightFacade Add/Remove/List Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test_brandon/data/courses.zip",
        coursesfirsthalf: "./test_brandon/data/coursesfirsthalf.zip",
        coursessecondhalf: "./test_brandon/data/coursessecondhalf.zip",
        empty: "./test_brandon/data/empty.zip",
        nocoursesfolder: "./test_brandon/data/nocoursesfolder.zip",
        novalidcourse: "./test_brandon/data/novalidcourse.zip",
        onevalidnosec: "./test_brandon/data/onevalidnosec.zip",
        onevalidonesec: "./test_brandon/data/onevalidonesec.zip",
        onevalidmultsec: "./test_brandon/data/onevalidmultsec.zip",
        onevalidonenonvalid: "./test_brandon/data/onevalidonenonvalid.zip",
        notazipfile: "./test_brandon/data/notazipfile.txt"
    };
    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir);
        }
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs
                .readFileSync(datasetsToLoad[id])
                .toString("base64");
        }
        try {
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs after each test, which should make each test independent from the previous one
        Log.test(`AfterTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    // addDataset unit tests
    it("Should add a valid dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Should multiple valid datasets", function () {
        const expected: string[] = ["coursesfirsthalf", "coursessecondhalf"];
        const shouldResolve: Promise<string[]> = insightFacade.addDataset(
            expected[0], datasets[expected[0]], InsightDatasetKind.Courses
        );
        return shouldResolve.then(function () {
            const futureResult: Promise<string[]> = insightFacade.addDataset(
                expected[1], datasets[expected[1]], InsightDatasetKind.Courses
            );
            return expect(futureResult).to.eventually.deep.equal(expected);
        }).catch(function () {
            return expect.fail();
        });
    });

    it("Should InsightError second same id dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        const shouldResolve: Promise<string[]> = insightFacade.addDataset(
            id, datasets[id], InsightDatasetKind.Courses
        );
        return shouldResolve.then(function () {
            const shouldReject: Promise<string[]> = insightFacade.addDataset(
                id, datasets[id], InsightDatasetKind.Courses
            );
            return expect(shouldReject).to.eventually.be.rejectedWith(InsightError);
        }).catch(function () {
            return expect.fail("first addDataset shouldn't have rejected");
        });
    });

    it("Same test as before but after adding another dataset", function () {
        const id1: string = "coursesfirsthalf";
        const id2: string = "coursessecondhalf";
        const expected: string[] = [id1, id2];
        const shouldResolve1 = insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Courses);
        const shouldResolve2 = shouldResolve1.then(function () {
            insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
        }).catch(function () {
            return expect.fail("first addDataset shouldn't have rejected");
        });
        return shouldResolve2.then(function () {
            const shouldReject: Promise<string[]> = insightFacade.addDataset(
                id1, datasets[id1], InsightDatasetKind.Courses
            );
            return expect(shouldReject).to.eventually.be.rejectedWith(InsightError);
        }).catch(function () {
            return expect.fail("second addDataset shouldn't have rejected");
        });
    });

    it("Should InsightError on attempt to add text file dataset", function () {
        const expected: string[] = ["notazipfile"];
        const shouldReject: Promise<string[]> = insightFacade.addDataset(
            expected[0], datasets[expected[0]], InsightDatasetKind.Courses
        );
        return expect(shouldReject).to.eventually.be.rejectedWith(InsightError);
    });

    it("Should InsightError on attempting to add empty courses folder", function () {
        const shouldReject: Promise<string[]> = insightFacade.addDataset(
            "empty", datasets["empty"], InsightDatasetKind.Courses
        );
        return expect(shouldReject).to.eventually.be.rejectedWith(InsightError);
    });

    it("Should InsightError on attempting to add with no courses folder", function () {
        const shouldReject: Promise<string[]> = insightFacade.addDataset(
            "nocoursesfolder", datasets["nocoursesfolder"], InsightDatasetKind.Courses
        );
        return expect(shouldReject).to.eventually.be.rejectedWith(InsightError);
    });

    it("Should InsightError on attempting to add with only invalid json course", function () {
        const shouldReject: Promise<string[]> = insightFacade.addDataset(
            "novalidcourse", datasets["novalidcourse"], InsightDatasetKind.Courses
        );
        return expect(shouldReject).to.eventually.be.rejectedWith(InsightError);
    });

    it("Should add valid dataset, with one valid JSON course no sections", function () {
        const expected: string[] = ["onevalidnosec"];
        const shouldResolve: Promise<string[]> = insightFacade.addDataset(
            expected[0], datasets[expected[0]], InsightDatasetKind.Courses
        );
        return expect(shouldResolve).to.eventually.be.deep.equal(expected);
    });

    it("Should add valid dataset, with one valid JSON course one section", function () {
        const expected: string[] = ["onevalidonesec"];
        const shouldResolve: Promise<string[]> = insightFacade.addDataset(
            expected[0], datasets[expected[0]], InsightDatasetKind.Courses
        );
        return expect(shouldResolve).to.eventually.be.deep.equal(expected);
    });

    it("Should add valid dataset, with one valid JSON course multiple sections", function () {
        const expected: string[] = ["onevalidmultsec"];
        const shouldResolve: Promise<string[]> = insightFacade.addDataset(
            expected[0], datasets[expected[0]], InsightDatasetKind.Courses
        );
        return expect(shouldResolve).to.eventually.be.deep.equal(expected);
    });

    it("Should add valid dataset, skipping invalid JSON course", function () {
        const expected: string[] = ["onevalidonenonvalid"];
        const shouldResolve: Promise<string[]> = insightFacade.addDataset(
            expected[0], datasets[expected[0]], InsightDatasetKind.Courses
        );
        return expect(shouldResolve).to.eventually.be.deep.equal(expected);
    });

    it("Should InsightError on attempting to add empty id", function () {
        const shouldReject: Promise<string[]> = insightFacade.addDataset(
            "", datasets["courses"], InsightDatasetKind.Courses
        );
        return expect(shouldReject).to.eventually.be.rejectedWith(InsightError);
    });

    it("Should InsightError on attempting to add id with underscores", function () {
        const shouldReject: Promise<string[]> = insightFacade.addDataset(
            "invalid_id_name", datasets["courses"], InsightDatasetKind.Courses
        );
        return expect(shouldReject).to.eventually.be.rejectedWith(InsightError);
    });

    it("Should InsightError on attempting to add id with only whitespace", function () {
        const shouldReject: Promise<string[]> = insightFacade.addDataset(
            "    ", datasets["courses"], InsightDatasetKind.Courses
        );
        return expect(shouldReject).to.eventually.be.rejectedWith(InsightError);
    });

    // InsightDatasetKind.Rooms should be invalid so make sure addDataset does
    // not work for those
    it("Should InsightError on attempting to add a InsightDatasetKind.Rooms kind", function () {
        const datasetID: string = "courses";
        const shouldReject: Promise<string[]> = insightFacade.addDataset(
            datasetID, datasets[datasetID], InsightDatasetKind.Rooms
        );
        return expect(shouldReject).to.eventually.be.rejectedWith(InsightError);
    });

    it("Same test as before but after good add", function () {
        const datasetID: string = "courses";
        const datasetID2: string = "failmeplease";
        const shouldAdd: Promise<string[]> = insightFacade.addDataset(
            datasetID, datasets[datasetID], InsightDatasetKind.Courses
        );
        const shouldReject: Promise<string[]> = shouldAdd.then(function () {
            return insightFacade.addDataset(
                datasetID2, datasets[datasetID], InsightDatasetKind.Rooms
            );
        }).catch(function () {
            return expect.fail("addDataset shouldn't have rejected");
        });
        return expect(shouldReject).to.eventually.be.rejectedWith(InsightError);
    });

    // removeDataset unit tests
    it("Should remove only added dataset", function () {
        const idToDelete = "courses";
        const shouldResolve: Promise<string[]> = insightFacade.addDataset(
            idToDelete, datasets[idToDelete], InsightDatasetKind.Courses
        );
        return shouldResolve.then(function () {
            const shouldDelete: Promise<string> = insightFacade.removeDataset(idToDelete);
            return expect(shouldDelete).to.eventually.be.deep.equal(idToDelete);
        }).catch(function () {
            return expect.fail("addDataset shouldn't have rejected");
        });
    });

    it("Should remove both added datasets", function () {
        const idToDelete1 = "coursesfirsthalf";
        const idToDelete2 = "coursessecondhalf";
        const shouldAdd1: Promise<string[]> = insightFacade.addDataset(
            idToDelete1, datasets[idToDelete1], InsightDatasetKind.Courses
        );
        const shouldAdd2: Promise<string[]> = shouldAdd1.then(function () {
            return insightFacade.addDataset(
                idToDelete2, datasets[idToDelete2], InsightDatasetKind.Courses
            );
        }).catch(function () {
            return expect.fail("addDataset shouldn't have rejected");
        });
        const shouldRemove1: Promise<string> = shouldAdd2.then(function () {
            return insightFacade.removeDataset(idToDelete1);
        }).catch(function () {
            return expect.fail("addDataset shouldn't have rejected");
        });
        const shouldRemove2: Promise<string> = shouldRemove1.then(function () {
            expect(shouldRemove1).to.deep.equal(idToDelete1);
            return insightFacade.removeDataset(idToDelete2);
        });
        return expect(shouldRemove2).to.eventually.be.deep.equal(idToDelete2);
    });

    it("Should remove both added datasets opposite order deletion", function () {
        const idToDelete1 = "coursesfirsthalf";
        const idToDelete2 = "coursessecondhalf";
        const shouldAdd1: Promise<string[]> = insightFacade.addDataset(
            idToDelete1, datasets[idToDelete1], InsightDatasetKind.Courses
        );
        const shouldAdd2: Promise<string[]> = shouldAdd1.then(function () {
            return insightFacade.addDataset(
                idToDelete2, datasets[idToDelete2], InsightDatasetKind.Courses
            );
        }).catch(function () {
            return expect.fail("addDataset shouldn't have rejected");
        });
        const shouldRemove2: Promise<string> = shouldAdd2.then(function () {
            return insightFacade.removeDataset(idToDelete2);
        }).catch(function () {
            return expect.fail("addDataset shouldn't have rejected");
        });
        const shouldRemove1: Promise<string> = shouldRemove2.then(function () {
            expect(shouldRemove2).to.deep.equal(idToDelete2);
            return insightFacade.removeDataset(idToDelete1);
        });
        return expect(shouldRemove1).to.eventually.be.deep.equal(idToDelete1);
    });

    it("Should NotFoundError when attempting to remove with no datasets", function () {
        const shouldReject: Promise<string> = insightFacade.removeDataset("a");
        return expect(shouldReject).to.eventually.be.rejectedWith(NotFoundError);
    });

    it("Should NotFoundError, removing from no datasets, after a good removal", function () {
        const correctID: string = "courses";
        const shouldAdd: Promise<string[]> = insightFacade.addDataset(
            correctID, datasets[correctID], InsightDatasetKind.Courses
        );
        const shouldRemove: Promise<string> = shouldAdd.then(function () {
            return insightFacade.removeDataset(correctID);
        }).catch(function () {
            return expect.fail("addDataset shouldn't have rejected");
        });
        const shouldReject: Promise<string> = shouldRemove.then(function () {
            return insightFacade.removeDataset(correctID);
        }).catch(function () {
            return expect.fail("first removeDataset shouldn't have rejected");
        });
        return expect(shouldReject).to.eventually.be.rejectedWith(NotFoundError);
    });

    it("Should NotFoundError when attempting to remove without matching id of anyone in", function () {
        const correctID: string = "courses";
        const noMatchID: string = "wowidontmatch";
        const shouldAdd: Promise<string[]> = insightFacade.addDataset(
            correctID, datasets[correctID], InsightDatasetKind.Courses
        );
        const shouldReject: Promise<string> = shouldAdd.then(function () {
            return insightFacade.removeDataset(noMatchID);
        }).catch(function () {
            return expect.fail("addDataset shouldn't have rejected");
        });
        return expect(shouldReject).to.eventually.be.rejectedWith(NotFoundError);
    });

    it("Should InsightError on attempting to remove invalid id, which is just empty str", function () {
        const badID = "";
        const shouldReject: Promise<string> = insightFacade.removeDataset(badID);
        return expect(shouldReject).to.eventually.be.rejectedWith(InsightError);
    });

    it("Should InsightError on attempting to remove invalid id with underscores", function () {
        const badID = "waffles_waffles_";
        const shouldReject: Promise<string> = insightFacade.removeDataset(badID);
        return expect(shouldReject).to.eventually.be.rejectedWith(InsightError);
    });

    it("Should InsightError on attempting to remove invalid with just whitespace", function () {
        const badID = "waffles_waffles_";
        const shouldReject: Promise<string> = insightFacade.removeDataset(badID);
        return expect(shouldReject).to.eventually.be.rejectedWith(InsightError);
    });

    // listDatasets unit tests
    it("Should return empty InsightDataset[] since nothing added", function () {
        const expectation: InsightDataset[] = [];
        const shouldBeEmpty: Promise<InsightDataset[]> = insightFacade.listDatasets();
        return expect(shouldBeEmpty).to.eventually.be.deep.equal(expectation);
    });

    it("Should list single known InsightDataset since only one added", function () {
        const singleDatasetID: string = "onevalidonesec";
        const singleDataset: InsightDataset = {
            id: singleDatasetID,
            kind: InsightDatasetKind.Courses,
            numRows: 1
        };
        const expectation: InsightDataset[] = [singleDataset];
        const shouldAdd: Promise<string[]> = insightFacade.addDataset(
            singleDatasetID, datasets[singleDatasetID], InsightDatasetKind.Courses
        );
        const shouldHaveOne: Promise<InsightDataset[]> = shouldAdd.then(function () {
            return insightFacade.listDatasets();
        }).catch(function () {
            return expect.fail("addDataset shouldn't have rejected");
        });
        return expect(shouldHaveOne).to.eventually.be.deep.equal(expectation);
    });

    it("Should list 2 known InsightDatasets since only 2 added", function () {
        const singleDatasetID: string = "onevalidonesec";
        const datasetID1: string = "onevalidonesec1";
        const datasetID2: string = "onevalidonesec2";
        const dataset1: InsightDataset = {
            id: datasetID1,
            kind: InsightDatasetKind.Courses,
            numRows: 1
        };
        const dataset2: InsightDataset = {
            id: datasetID2,
            kind: InsightDatasetKind.Courses,
            numRows: 1
        };
        const expectation: InsightDataset[] = [dataset1, dataset2];
        const shouldAdd1: Promise<string[]> = insightFacade.addDataset(
            datasetID1, datasets[singleDatasetID], InsightDatasetKind.Courses
        );
        const shouldAdd2: Promise<string[]> = shouldAdd1.then(function () {
            return insightFacade.addDataset(
                datasetID2, datasets[singleDatasetID], InsightDatasetKind.Courses
            );
        }).catch(function () {
            return expect.fail("first addDataset shouldn't have rejected");
        });
        const shouldHaveTwo: Promise<InsightDataset[]> = shouldAdd2.then(function () {
            return insightFacade.listDatasets();
        }).catch(function () {
            return expect.fail("second addDataset shouldn't have rejected");
        });
        return expect(shouldHaveTwo).to.eventually.be.deep.equal(expectation);
    });

    it("Should list 0 InsightDatasets since removed the only one", function () {
        const singleDatasetID: string = "onevalidonesec";
        const expectation: InsightDataset[] = [];
        const shouldAdd: Promise<string[]> = insightFacade.addDataset(
            singleDatasetID, datasets[singleDatasetID], InsightDatasetKind.Courses
        );
        const shouldRemove: Promise<string> = shouldAdd.then(function () {
            return insightFacade.removeDataset(singleDatasetID);
        }).catch(function () {
            return expect.fail("addDataset shouldn't have rejected");
        });
        const shouldBeEmpty: Promise<InsightDataset[]> = shouldRemove.then(function () {
            return insightFacade.listDatasets();
        }).catch(function () {
            return expect.fail("removeDataset shouldn't have rejected");
        });
        return expect(shouldBeEmpty).to.eventually.be.deep.equal(expectation);
    });

    it("Should list 1 known InsightDatasets since only 2 added but 1 removed", function () {
        const singleDatasetID: string = "onevalidonesec";
        const datasetID1: string = "onevalidonesec1";
        const datasetID2: string = "onevalidonesec2";
        const dataset1: InsightDataset = {
            id: datasetID1,
            kind: InsightDatasetKind.Courses,
            numRows: 1
        };
        const dataset2: InsightDataset = {
            id: datasetID2,
            kind: InsightDatasetKind.Courses,
            numRows: 1
        };
        const expectation: InsightDataset[] = [dataset1];
        const shouldAdd1: Promise<string[]> = insightFacade.addDataset(
            datasetID1, datasets[singleDatasetID], InsightDatasetKind.Courses
        );
        const shouldAdd2: Promise<string[]> = shouldAdd1.then(function () {
            return insightFacade.addDataset(
                datasetID2, datasets[singleDatasetID], InsightDatasetKind.Courses
            );
        }).catch(function () {
            return expect.fail("first addDataset shouldn't have rejected");
        });
        const shouldRemove: Promise<string> = shouldAdd2.then(function () {
            return insightFacade.removeDataset(datasetID2);
        }).catch(function () {
            return expect.fail("second addDataset shouldn't have rejected");
        });
        const shouldHaveOne: Promise<InsightDataset[]> = shouldRemove.then(function () {
            return insightFacade.listDatasets();
        }).catch(function () {
            return expect.fail("removeDataset shouldn't have rejected");
        });
        return expect(shouldHaveOne).to.eventually.be.deep.equal(expectation);
    });

    it("Same test as before but removing 1st dataset instead", function () {
        const singleDatasetID: string = "onevalidonesec";
        const datasetID1: string = "onevalidonesec1";
        const datasetID2: string = "onevalidonesec2";
        const dataset1: InsightDataset = {
            id: datasetID1,
            kind: InsightDatasetKind.Courses,
            numRows: 1
        };
        const dataset2: InsightDataset = {
            id: datasetID2,
            kind: InsightDatasetKind.Courses,
            numRows: 1
        };
        const expectation: InsightDataset[] = [dataset2];
        const shouldAdd1: Promise<string[]> = insightFacade.addDataset(
            datasetID1, datasets[singleDatasetID], InsightDatasetKind.Courses
        );
        const shouldAdd2: Promise<string[]> = shouldAdd1.then(function () {
            return insightFacade.addDataset(
                datasetID2, datasets[singleDatasetID], InsightDatasetKind.Courses
            );
        }).catch(function () {
            return expect.fail("first addDataset shouldn't have rejected");
        });
        const shouldRemove: Promise<string> = shouldAdd2.then(function () {
            return insightFacade.removeDataset(datasetID1);
        }).catch(function () {
            return expect.fail("second addDataset shouldn't have rejected");
        });
        const shouldHaveOne: Promise<InsightDataset[]> = shouldRemove.then(function () {
            return insightFacade.listDatasets();
        }).catch(function () {
            return expect.fail("removeDataset shouldn't have rejected");
        });
        return expect(shouldHaveOne).to.eventually.be.deep.equal(expectation);
    });
});

/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: {
        [id: string]: { path: string; kind: InsightDatasetKind };
    } = {
        courses: {
            path: "./test_brandon/data/courses.zip",
            kind: InsightDatasetKind.Courses,
        },
        othercourses: {
            path: "./test_brandon/data/courses.zip",
            kind: InsightDatasetKind.Courses,
        },
    };
    let insightFacade: InsightFacade;
    let testQueries: ITestQuery[] = [];

    // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    before(function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = TestUtil.readTestQueries();
        } catch (err) {
            expect.fail(
                "",
                "",
                `Failed to read one or more test queries. ${err}`,
            );
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Will fail* if there is a problem reading ANY dataset.
        const loadDatasetPromises: Array<Promise<string[]>> = [];
        insightFacade = new InsightFacade();
        for (const id of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[id];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(
                insightFacade.addDataset(id, data, ds.kind),
            );
        }
        return Promise.all(loadDatasetPromises).catch((err) => {
            /* *IMPORTANT NOTE: This catch is to let this run even without the implemented addDataset,
             * for the purposes of seeing all your tests run.
             * TODO For C1, remove this catch block (but keep the Promise.all)
             */
            return Promise.resolve("HACK TO LET QUERIES RUN");
        });
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Dynamically create and run a test for each query in testQueries
    // Creates an extra "test" called "Should run test queries" as a byproduct. Don't worry about it
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function () {
                    const futureResult: Promise<
                        any[]
                    > = insightFacade.performQuery(test.query);
                    return TestUtil.verifyQueryResult(futureResult, test);
                });
            }
        });
    });
});
