const path = require('path');
const fs = require('fs');
const EventEmitter = require('events').EventEmitter;
const util = require('util');
const screenshotPath =  path.join(__dirname, './error-shots');
const logger = require('../../lib/logger');
const runnerResults = [];

function getRunner(cid) {
    const result = runnerResults.find(res => res.cid === cid);
    if (!result) {
        throw new Error(`Results with runner cid ${cid} was not found.`);
    }

    return result;
}

const  Reporter = ()  => {
    util.inherits(Reporter, EventEmitter);

    this.on('runner:log', (logData) => {
        const logLevel = logData.data[0].logLevel;
        const message = logData.data[0].message;
        const screenshot = logData.data[0].screenshot; 
        let log;

        switch (logLevel) {
            default: 
                log = logger.info;
                break;
            case 'info':
                log = logger.info;
                break;
            case 'error':
                log = logger.error;
                break;
            case 'verbose':
                log = logger.verbose;
                break;
        }
        log(`${logData.parent} : ${logData.title} : ${message}`);
        
        if (screenshot) {
            let fileName = `./${logData.parent}-${logData.title}.png`;
            fs.writeFileSync(`${screenshotPath}-${fileName}`, screenshot.value, 'base64');
            log(`${logData.parent} : ${logData.title} : Screenshot Saved`);
        }
    });

    this.on('runner:start', (runner) => {
        const cid = runner.cid;

        const currentRunnerResult = {
            cid,
            capabilities: runner.capabilities,
            runnerTestsNumber: {
                failing: 0,
                passing: 0,
                pending: 0
            },
            specFileHash: runner.specHash,
            specFilePath: runner.specs,
        };

        runnerResults.push(currentRunnerResult);
    });

    this.on('test:start', (test) => {
        logger.info(`Running test: ${test.fullTitle}`);
    });

    this.on('test:pass', (test) => {
        const runner = getRunner(test.cid).runnerTestsNumber;
        runner.passing++;
        const { passing, failing } = runner;

        logger.info(`---------------------------------------
                    ${test.fullTitle}: ✅
                    Passed: ${passing}
                    Failed: ${failing}
                    ---------------------------------------`);
    });

    this.on('test:fail', (test) => {
        const runner = getRunner(test.cid).runnerTestsNumber;
        runner.failing++;
        const { passing, failing } = runner;

        logger.info(`---------------------------------------
                    ${test.fullTitle}: ❌
                    Passed: ${passing}
                    Failed: ${failing}
                    ---------------------------------------`);
    });

    this.on('test:pending', (test) =>
        getRunner(test.cid).runnerTestsNumber.pending++
    );
};

Reporter.reporterName = 'custom-reporter';

export default Reporter;
