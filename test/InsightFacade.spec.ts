import * as chai from "chai";
import {expect} from "chai";
import * as fs from "fs-extra";
import * as chaiAsPromised from "chai-as-promised";
import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "../src/controller/IInsightFacade";
// added NotFoundError import
import InsightFacade from "../src/controller/InsightFacade";
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
        courses: "./test/data/courses.zip",
        underscore_courses: "./test/data/courses_underscore.zip",
        invalidZip: "./test/data/invalid_zip.zip",
        invalidJson: "./test/data/invalid_json.zip",
        noSectionCourses: "./test/data/noSectionCourses.zip"
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
    // This is a unit test. You should create more like this!
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
    it("Should rejecting add a dataset with empty string id", function () {
        const id: string = "";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.eventually.rejectedWith(InsightError);
    });
    it("Should reject adding a dataset that already exists in datasets array", function () {
        const id: string = "courses";
        let futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return futureResult.then( (r) => {
            let futureResult2: Promise<string[]> = insightFacade.addDataset(
                id,
                datasets[id],
                InsightDatasetKind.Courses,
            );
            return expect(futureResult2).to.be.eventually.rejectedWith(InsightError);
        });
    });
    it("Should reject adding a dataset with zero valid course sections", function () {
        const id: string = "noSectionCourses";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.eventually.rejectedWith(InsightError);
    });

    it("Should InsightError on attempting to add a InsightDatasetKind.Rooms kind", function () {
        const id: string = "courses";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id, datasets[id], InsightDatasetKind.Rooms
        );
        return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    });

    // invalid json for add dataset test
    it("Should reject adding a dataset that has invalid json file in folder", function () {
        const id: string = "invalidJson";
        let futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.eventually.rejectedWith(InsightError);
    });

    // Has to be a valid zip file; this zip's root directory will contain many files under a folder called courses
    // This directory name will not vary with the dataset id.
    it("Should reject adding an invalid dataset - invalid zip file", function () {
        const id: string = "invalidZip";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.eventually.rejectedWith(InsightError);
    });
    it("Should reject invalid dataset - Contains whitespace only in id", function () {
        const id: string = "  ";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets["courses"],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.eventually.rejectedWith(InsightError);
    });
    it("Should reject adding invalid dataset - Contains the underscore character", function () {
        const id: string = "underscore_courses";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.eventually.rejectedWith(InsightError);
    });
    it("Should remove an existing dataset", function () {
        const id: string = "courses";
        const expected: string = id;
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((r) => {
            const futureResult: Promise<string> = insightFacade.removeDataset(id);
            return expect(futureResult).to.eventually.deep.equal(expected);
        });
    });
    it("Should reject removal of dataset not loaded", function () {
        const id: string = "courses";
        const futureResult: Promise<string> = insightFacade.removeDataset(id);
        return expect(futureResult).to.be.eventually.rejectedWith(NotFoundError);
    });

    it("Should reject removal of invalid id - whitespace", function () {
        const id: string = " ";
        const futureResult: Promise<string> = insightFacade.removeDataset(id);
        return expect(futureResult).to.be.eventually.rejectedWith(InsightError);
    });
    it("Should reject removal of invalid id - empty string", function () {
        const id: string = "";
        const futureResult: Promise<string> = insightFacade.removeDataset(id);
        return expect(futureResult).to.be.eventually.rejectedWith(InsightError);
    });
    it("Should reject removal of invalid id - underscore", function () {
        const id: string = "courses_underscore";
        const futureResult: Promise<string> = insightFacade.removeDataset(id);
        return expect(futureResult).to.be.eventually.rejectedWith(InsightError);
    });
    // List DATASET
    it("Should list dataset - only one dataset", function () {
        const id: string = "courses";
        const expected: InsightDataset[] = [{
            id: "courses",
            kind: InsightDatasetKind.Courses,
            numRows: 64612
        }];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((r) => {
            const futureResult: Promise<InsightDataset[]> = insightFacade.listDatasets();
            return expect(futureResult).to.eventually.deep.equal(expected);
        });
    });

    it("Should list dataset - two dataset", function () {
        const id: string = "courses";
        const expected: InsightDataset[] = [{
            id: "courses",
            kind: InsightDatasetKind.Courses,
            numRows: 64612
        }, {
                id: "courses2",
                kind: InsightDatasetKind.Courses,
                numRows: 64612
            }];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((r) => {
            return insightFacade.addDataset("courses2", datasets[id], InsightDatasetKind.Courses);
            }).then((r) =>  {
            const futureResult: Promise<InsightDataset[]> = insightFacade.listDatasets();
            return expect(futureResult).to.eventually.deep.equal(expected);
        });
    });

    it("Should add then remove then list dataset", function () {
        const id: string = "courses";
        const expected: InsightDataset[] = [];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((r) => {
            return insightFacade.removeDataset(id);
        }).then((r) =>  {
            const futureResult: Promise<InsightDataset[]> = insightFacade.listDatasets();
            return expect(futureResult).to.eventually.deep.equal(expected);
        });
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
            path: "./test/data/courses.zip",
            kind: InsightDatasetKind.Courses,
        },
        coursesSmall: {
            path: "./test/data/coursesSmall.zip",
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
