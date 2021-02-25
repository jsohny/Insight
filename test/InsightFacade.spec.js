"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const chai_1 = require("chai");
const fs = require("fs-extra");
const chaiAsPromised = require("chai-as-promised");
const IInsightFacade_1 = require("../src/controller/IInsightFacade");
const InsightFacade_1 = require("../src/controller/InsightFacade");
const Util_1 = require("../src/Util");
const TestUtil_1 = require("./TestUtil");
chai.use(chaiAsPromised);
describe("InsightFacade Add/Remove/List Dataset", function () {
    const datasetsToLoad = {
        courses: "./test/data/courses.zip",
        underscore_courses: "./test/data/courses_underscore.zip",
        invalidZip: "./test/data/invalid_zip.zip",
        invalidJson: "./test/data/invalid_json.zip",
        noSectionCourses: "./test/data/noSectionCourses.zip"
    };
    let datasets = {};
    let insightFacade;
    const cacheDir = __dirname + "/../data";
    before(function () {
        Util_1.default.test(`Before all`);
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir);
        }
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs
                .readFileSync(datasetsToLoad[id])
                .toString("base64");
        }
        try {
            insightFacade = new InsightFacade_1.default();
        }
        catch (err) {
            Util_1.default.error(err);
        }
    });
    beforeEach(function () {
        Util_1.default.test(`BeforeTest: ${this.currentTest.title}`);
    });
    after(function () {
        Util_1.default.test(`After: ${this.test.parent.title}`);
    });
    afterEach(function () {
        Util_1.default.test(`AfterTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade_1.default();
        }
        catch (err) {
            Util_1.default.error(err);
        }
    });
    it("Should add a valid dataset", function () {
        const id = "courses";
        const expected = [id];
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.eventually.deep.equal(expected);
    });
    it("Should rejecting add a dataset with empty string id", function () {
        const id = "";
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("Should reject adding a dataset that already exists in datasets array", function () {
        const id = "courses";
        let futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return futureResult.then((r) => {
            let futureResult2 = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
            return chai_1.expect(futureResult2).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
        });
    });
    it("Should reject adding a dataset with zero valid course sections", function () {
        const id = "noSectionCourses";
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("Should InsightError on attempting to add a InsightDatasetKind.Rooms kind", function () {
        const id = "courses";
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Rooms);
        return chai_1.expect(futureResult).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("Should reject adding a dataset that has invalid json file in folder", function () {
        const id = "invalidJson";
        let futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("Should reject adding an invalid dataset - invalid zip file", function () {
        const id = "invalidZip";
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("Should reject invalid dataset - Contains whitespace only in id", function () {
        const id = "  ";
        const futureResult = insightFacade.addDataset(id, datasets["courses"], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("Should reject adding invalid dataset - Contains the underscore character", function () {
        const id = "underscore_courses";
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("Should remove an existing dataset", function () {
        const id = "courses";
        const expected = id;
        return insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses).then((r) => {
            const futureResult = insightFacade.removeDataset(id);
            return chai_1.expect(futureResult).to.eventually.deep.equal(expected);
        });
    });
    it("Should reject removal of dataset not loaded", function () {
        const id = "courses";
        const futureResult = insightFacade.removeDataset(id);
        return chai_1.expect(futureResult).to.be.eventually.rejectedWith(IInsightFacade_1.NotFoundError);
    });
    it("Should reject removal of invalid id - whitespace", function () {
        const id = " ";
        const futureResult = insightFacade.removeDataset(id);
        return chai_1.expect(futureResult).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("Should reject removal of invalid id - empty string", function () {
        const id = "";
        const futureResult = insightFacade.removeDataset(id);
        return chai_1.expect(futureResult).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("Should reject removal of invalid id - underscore", function () {
        const id = "courses_underscore";
        const futureResult = insightFacade.removeDataset(id);
        return chai_1.expect(futureResult).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("Should list dataset - only one dataset", function () {
        const id = "courses";
        const expected = [{
                id: "courses",
                kind: IInsightFacade_1.InsightDatasetKind.Courses,
                numRows: 64612
            }];
        return insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses).then((r) => {
            const futureResult = insightFacade.listDatasets();
            return chai_1.expect(futureResult).to.eventually.deep.equal(expected);
        });
    });
    it("Should list dataset - two dataset", function () {
        const id = "courses";
        const expected = [{
                id: "courses",
                kind: IInsightFacade_1.InsightDatasetKind.Courses,
                numRows: 64612
            }, {
                id: "courses2",
                kind: IInsightFacade_1.InsightDatasetKind.Courses,
                numRows: 64612
            }];
        return insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses).then((r) => {
            return insightFacade.addDataset("courses2", datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        }).then((r) => {
            const futureResult = insightFacade.listDatasets();
            return chai_1.expect(futureResult).to.eventually.deep.equal(expected);
        });
    });
    it("Should add then remove then list dataset", function () {
        const id = "courses";
        const expected = [];
        return insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses).then((r) => {
            return insightFacade.removeDataset(id);
        }).then((r) => {
            const futureResult = insightFacade.listDatasets();
            return chai_1.expect(futureResult).to.eventually.deep.equal(expected);
        });
    });
});
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery = {
        courses: {
            path: "./test/data/courses.zip",
            kind: IInsightFacade_1.InsightDatasetKind.Courses,
        },
        coursesSmall: {
            path: "./test/data/coursesSmall.zip",
            kind: IInsightFacade_1.InsightDatasetKind.Courses,
        },
    };
    let insightFacade;
    let testQueries = [];
    before(function () {
        Util_1.default.test(`Before: ${this.test.parent.title}`);
        try {
            testQueries = TestUtil_1.default.readTestQueries();
        }
        catch (err) {
            chai_1.expect.fail("", "", `Failed to read one or more test queries. ${err}`);
        }
        const loadDatasetPromises = [];
        insightFacade = new InsightFacade_1.default();
        for (const id of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[id];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(insightFacade.addDataset(id, data, ds.kind));
        }
        return Promise.all(loadDatasetPromises).catch((err) => {
            return Promise.resolve("HACK TO LET QUERIES RUN");
        });
    });
    beforeEach(function () {
        Util_1.default.test(`BeforeTest: ${this.currentTest.title}`);
    });
    after(function () {
        Util_1.default.test(`After: ${this.test.parent.title}`);
    });
    afterEach(function () {
        Util_1.default.test(`AfterTest: ${this.currentTest.title}`);
    });
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function () {
                    const futureResult = insightFacade.performQuery(test.query);
                    return TestUtil_1.default.verifyQueryResult(futureResult, test);
                });
            }
        });
    });
});
//# sourceMappingURL=InsightFacade.spec.js.map