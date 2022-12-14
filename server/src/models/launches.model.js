const axios = require('axios');
const launches = require('./launches.mongo');
const planets = require('./planets.mongo');

const DEFAULT_FLIGHT_NUMBER = 0;

const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query';

async function populateLaunches() {
    const response = await axios.post(SPACEX_API_URL, {
        query: {},
        options: {
            pagination: false,
            populate: [
                {
                    path: 'rocket',
                    select: {
                        name:1
                    }
                },
                {
                    path:'payloads',
                    select: {
                        customers: 1
                    }
                }
            ]
        }
    });

    if (response.status !== 200) {
        console.log('Problem downloading data');
        throw new Error('Space X launch data fail')
    }
    console.log(response.data.docs.length)
    const launchDocs = response.data.docs;
    for (const launchDoc of launchDocs) {
        const payloads = launchDoc['payloads'];
        const customers = payloads.flatMap((payload) => {
          return payload['customers'];
        });

        const launch = {
            flightNumber: launchDoc['flight_number'],
            mission: launchDoc['name'],
            rocket: launchDoc['rocket']['name'],
            launchDate: launchDoc['date_local'],
            upcoming: launchDoc['upcoming'],
            success: launchDoc['success'],
            customers,
          };
          console.log(`${launch.flightNumber} ${launch.mission}`);
          await saveLaunch(launch);
    }
}


async function loadLaunchesData() {
    const firstLaunch = await findLaunch({flightNumber: 1, rocket: 'Falcon 1', mission: 'FalconSat'});
    if (firstLaunch) {
        console.log('Launch data already loaded')
    } else {
        await populateLaunches()
    }
}

async function findLaunch(filter) {
    return await launches.findOne(filter)
}
async function existLaunchWithId(launchId) {
    return await findLaunch({
        flightNumber: launchId,
    });
}

async function getLatestFlightNumber() {
    const latestLaunch = await launches.findOne().sort('-flightNumber');
    return latestLaunch ? latestLaunch.flightNumber: DEFAULT_FLIGHT_NUMBER;
}

async function getAllLaunches(skip, limit) {
    console.log('skip and limit', skip, limit)
    return await launches
    .find({}, {'_id': 0, '__v': 0})
    .sort({flightNumber: 1})
    .skip(skip)
    .limit(limit)
}

async function scheduleNewLaunch(launch) {
    const planet = await planets.findOne({
        keplerName: launch.target,
    });

    if (!planet) {
        throw new Error('No matching planet was found')
    }
    const newLaunch = Object.assign(launch, {
        customers: ['nasa'],
        upcoming: true,
        success: true,
        flightNumber: await getLatestFlightNumber() + 1
    });
    await saveLaunch(newLaunch);
}

async function saveLaunch(launch) {
    try {
        await launches.findOneAndUpdate({
            flightNumber: launch.flightNumber,
        }, launch, {
            upsert: true,
        });
    } catch (err) {
        console.error(`Could not save planet, ${launch}`)
    }
}

async function abortLaunchById(launchId) {
    const aborted =  await launches.updateOne({
        flightNumber: launchId,
    }, {
        upcoming: false,
        success: false
    });
    return aborted.modifiedCount === 1;
}

module.exports = {
    getAllLaunches,
    scheduleNewLaunch,
    existLaunchWithId,
    abortLaunchById,
    loadLaunchesData
}