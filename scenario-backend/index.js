const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());

app.listen(3000, () => {
    console.log('Server radi na http://localhost:3000');
});

let locks = [];


function readJSON(path) {
    return JSON.parse(fs.readFileSync(path, 'utf-8'));
}

function writeJSON(path, data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
}
app.post('/api/scenarios', (req, res) => {
    const data = readJSON('./data/scenarios.json');

    const newId = data.lastScenarioId + 1;
    const title = req.body.title && req.body.title.trim() !== ''
        ? req.body.title
        : 'Neimenovani scenarij';

    const newScenario = {
        id: newId,
        title: title,
        content: [
            {
                lineId: 1,
                nextLineId: null,
                text: ""
            }
        ]
    };

    data.lastScenarioId = newId;
    data.scenarios.push(newScenario);

    writeJSON('./data/scenarios.json', data);

    res.status(200).json(newScenario);
});

app.post('/api/scenarios/:scenarioId/lines/:lineId/lock', (req, res) => {
    const scenarioId = parseInt(req.params.scenarioId);
    const lineId = parseInt(req.params.lineId);
    const userId = req.body.userId;

    const scenarioData = readJSON('./data/scenarios.json');

    const scenario = scenarioData.scenarios.find(s => s.id === scenarioId);
    if (!scenario) {
        return res.status(404).json({ message: "Scenario ne postoji!" });
    }

    const line = scenario.content.find(l => l.lineId === lineId);
    if (!line) {
        return res.status(404).json({ message: "Linija ne postoji!" });
    }

    const existingLock = locks.find(
        l => l.scenarioId === scenarioId && l.lineId === lineId
    );

    if (existingLock && existingLock.userId !== userId) {
        return res.status(409).json({ message: "Linija je vec zakljucana!" });
    }

    locks = locks.filter(l => l.userId !== userId);

    locks.push({
        scenarioId,
        lineId,
        userId
    });

    res.status(200).json({ message: "Linija je uspjesno zakljucana!" });
});
