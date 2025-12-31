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

function getNextScenarioId() {
    const dir = './data/scenarios';
    const files = fs.readdirSync(dir);

    if (files.length === 0) return 1;

    const ids = files.map(f =>
        parseInt(f.replace('scenario-', '').replace('.json', ''))
    );

    return Math.max(...ids) + 1;
}


function writeJSON(path, data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
}
app.post('/api/scenarios', (req, res) => {
    const title = req.body.title && req.body.title.trim() !== ''
        ? req.body.title
        : 'Neimenovani scenarij';

    const newId = getNextScenarioId();


    const scenario = {
        id: newId,
        title,
        content: [
            { lineId: 1, nextLineId: null, text: "" }
        ]
    };

    writeJSON(`./data/scenarios/scenario-${newId}.json`, scenario);

    res.status(200).json(scenario);
});

app.post('/api/scenarios/:scenarioId/lines/:lineId/lock', (req, res) => {
    const scenarioId = parseInt(req.params.scenarioId);
    const lineId = parseInt(req.params.lineId);
    const userId = req.body.userId;

    const path = `./data/scenarios/scenario-${scenarioId}.json`;

    if (!fs.existsSync(path)) {
        return res.status(404).json({ message: "Scenario ne postoji!" });
    }

    const scenario = readJSON(path);

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

    locks.push({ scenarioId, lineId, userId });

    res.status(200).json({ message: "Linija je uspjesno zakljucana!" });
});

function wrapText(text) {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const lines = [];

    for (let i = 0; i < words.length; i += 20) {
        lines.push(words.slice(i, i + 20).join(" "));
    }

    return lines;
}


app.put('/api/scenarios/:scenarioId/lines/:lineId', (req, res) => {
    const scenarioId = parseInt(req.params.scenarioId);
    const lineId = parseInt(req.params.lineId);
    const { userId, newText } = req.body;

    if (!Array.isArray(newText) || newText.length === 0) {
        return res.status(400).json({
            message: "Niz new_text ne smije biti prazan!"
        });
    }

    const scenarioPath = `./data/scenarios/scenario-${scenarioId}.json`;

    if (!fs.existsSync(scenarioPath)) {
        return res.status(404).json({
            message: "Scenario ne postoji!"
        });
    }

    const scenario = readJSON(scenarioPath);

    const lineIndex = scenario.content.findIndex(l => l.lineId === lineId);
    if (lineIndex === -1) {
        return res.status(404).json({
            message: "Linija ne postoji!"
        });
    }
    const lock = locks.find(
        l => l.scenarioId === scenarioId && l.lineId === lineId
    );

    if (!lock) {
        return res.status(409).json({
            message: "Linija nije zakljucana!"
        });
    }

    if (lock.userId !== userId) {
        return res.status(409).json({
            message: "Linija je vec zakljucana!"
        });
    }

    const line = scenario.content[lineIndex];
    const oldNextLineId = line.nextLineId;

    let wrappedLines = [];
    newText.forEach(text => {
        wrappedLines.push(...wrapText(text));
    });

    line.text = wrappedLines[0];

    let maxLineId = Math.max(...scenario.content.map(l => l.lineId));
    let previousLine = line;

    for (let i = 1; i < wrappedLines.length; i++) {
        maxLineId++;

        const newLine = {
            lineId: maxLineId,
            text: wrappedLines[i],
            nextLineId: null
        };

        previousLine.nextLineId = newLine.lineId;
        scenario.content.splice(lineIndex + i, 0, newLine);
        previousLine = newLine;
    }

    previousLine.nextLineId = oldNextLineId;

    const deltas = readJSON('./data/deltas.json');
    deltas.push({
        scenarioId,
        type: "line_update",
        lineId,
        nextLineId: previousLine.nextLineId,
        content: wrappedLines.join(" "),
        timestamp: Math.floor(Date.now() / 1000)
    });

    locks = locks.filter(
        l => !(l.scenarioId === scenarioId && l.lineId === lineId)
    );

    writeJSON(scenarioPath, scenario);
    writeJSON('./data/deltas.json', deltas);

    res.status(200).json({
        message: "Linija je uspjesno azurirana!"
    });
});

app.post('/api/scenarios/:scenarioId/characters/lock', (req, res) => {
    const scenarioId = parseInt(req.params.scenarioId);
    const { userId, characterName } = req.body;

    const scenarioPath = `./data/scenarios/scenario-${scenarioId}.json`;
    if (!fs.existsSync(scenarioPath)) {
        return res.status(404).json({
            message: "Scenario ne postoji!"
        });
    }

    const existingLock = locks.find(
        l =>
            l.type === "character" &&
            l.scenarioId === scenarioId &&
            l.characterName === characterName
    );

    if (existingLock) {
        return res.status(409).json({
            message: "Konflikt! Ime lika je vec zakljucano!"
        });
    }

    locks.push({
        type: "character",
        scenarioId,
        characterName,
        userId
    });

    res.status(200).json({
        message: "Ime lika je uspjesno zakljucano!"
    });
});

