const {getAllLaunches, scheduleNewLaunch, existLaunchWithId, abortLaunchById} = require('../../models/launches.model');
const {getPagination} = require('../../services/query');


async function httpGetAllLaunches(req, res) {
    console.log(req.body, 'req.body')
    const {skip, limit} = getPagination(req.query);
    return res.status(200).json(await getAllLaunches(skip, limit))
}

async function httpAddNewLaunch(req, res) {
    const {mission, rocket, launchDate, target} = req.body;
    if (!mission || !rocket || !launchDate || !target) {
        return res.status(400).json({error: "missing values"})
    }
    const dateObj = new Date(launchDate);

    if (isNaN(dateObj)) {
        return res.status(400).json({
            error: 'Invalid launch date',
        });
    }
    const newLaunch = {mission, rocket, launchDate: dateObj, target}
    await scheduleNewLaunch(newLaunch);
    return res.status(201).json(newLaunch);
}

async function httpAbortLaunch(req, res) {
    const launchId = +req.params.id;
    const existLaunch = await existLaunchWithId(launchId)
    if (!existLaunch) {
        return res.status(404).json({error: launchId + ' Launch not found'})
    };
    const aborted = await abortLaunchById(launchId);
    if (!aborted) {
        return res.status(400).json({
            error: 'Launch not aborted',
        })
    }

    return res.status(200).json({ok: true});
}

module.exports = {
    httpGetAllLaunches,
    httpAddNewLaunch,
    httpAbortLaunch
}