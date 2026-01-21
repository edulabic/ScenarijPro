const sequelize = require("./baza");   
const { Scenario, Line, Delta } = require("./models/index.js");

const express = require("express");
const app = express();

app.use(express.json());

sequelize.sync({ force: true })
  .then(() => {
    app.listen(3000, () => {
      console.log("Server running on http://localhost:3000");
    });
  })
  .catch(err => {
    console.error("GRESKA PRIJE SYNC:", err);
  });

let locks = [];

function wrapText(text) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const lines = [];

  for (let i = 0; i < words.length; i += 20) {
    lines.push(words.slice(i, i + 20).join(" "));
  }

  return lines;
}

app.post('/api/scenarios', async (req, res) => {
  try {
    const title = req.body.title && req.body.title.trim() !== ''
      ? req.body.title
      : 'Neimenovani scenarij';

    const scenario = await Scenario.create({ title });

    await Line.create({
      scenarioId: scenario.id,
      lineId: 1,
      nextLineId: null,
      text: ""
    });

    const result = await Scenario.findByPk(scenario.id, {
      include: [{ model: Line, as: 'content' }]
    });

    const response = {
      id: result.id,
      title: result.title,
      content: result.content.map(l => ({
        lineId: l.lineId,
        nextLineId: l.nextLineId,
        text: l.text
      }))
    };

    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Greška pri kreiranju scenarija!" });
  }
});

app.post('/api/scenarios/:scenarioId/lines/:lineId/lock', async (req, res) => {
  try {
    const scenarioId = parseInt(req.params.scenarioId);
    const lineId = parseInt(req.params.lineId);
    const userId = req.body.userId;
    const scenario = await Scenario.findByPk(scenarioId);
    if (!scenario) {
      return res.status(404).json({ message: "Scenario ne postoji!" });
    }

    const line = await Line.findOne({
      where: { scenarioId, lineId }
    });

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
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Greška pri zaključavanju linije!" });
  }
});

app.put('/api/scenarios/:scenarioId/lines/:lineId', async (req, res) => {
  try {
    const scenarioId = parseInt(req.params.scenarioId);
    const lineId = parseInt(req.params.lineId);
    const { userId, newText } = req.body;

    if (!Array.isArray(newText) || newText.length === 0) {
      return res.status(400).json({
        message: "Niz new_text ne smije biti prazan!"
      });
    }
    const scenario = await Scenario.findByPk(scenarioId);
    if (!scenario) {
      return res.status(404).json({
        message: "Scenario ne postoji!"
      });
    }
    const line = await Line.findOne({
      where: { scenarioId, lineId }
    });

    if (!line) {
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

    const oldNextLineId = line.nextLineId;

    
    let wrappedLines = [];
    newText.forEach(text => {
      wrappedLines.push(...wrapText(text));
    });

    line.text = wrappedLines[0];
    await line.save();

    const maxLine = await Line.findOne({
      where: { scenarioId },
      order: [['lineId', 'DESC']]
    });

    let maxLineId = maxLine ? maxLine.lineId : 0;
    let previousLineId = lineId;
    let previousNextLineId = oldNextLineId;

    for (let i = 1; i < wrappedLines.length; i++) {
      maxLineId++;

      const newLine = await Line.create({
        scenarioId,
        lineId: maxLineId,
        text: wrappedLines[i],
        nextLineId: null
      });

      await Line.update(
        { nextLineId: newLine.lineId },
        { where: { scenarioId, lineId: previousLineId } }
      );

      previousLineId = newLine.lineId;
    }

    await Line.update(
      { nextLineId: oldNextLineId },
      { where: { scenarioId, lineId: previousLineId } }
    );

    await Delta.create({
      scenarioId,
      type: "line_update",
      lineId,
      nextLineId: oldNextLineId,
      content: wrappedLines.join(" "),
      timestamp: Math.floor(Date.now() / 1000)
    });

    locks = locks.filter(
      l => !(l.scenarioId === scenarioId && l.lineId === lineId)
    );

    res.status(200).json({
      message: "Linija je uspjesno azurirana!"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Greška pri ažuriranju linije!" });
  }
});

app.post('/api/scenarios/:scenarioId/characters/lock', async (req, res) => {
  try {
    const scenarioId = parseInt(req.params.scenarioId);
    const { userId, characterName } = req.body;

    const scenario = await Scenario.findByPk(scenarioId);
    if (!scenario) {
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Greška pri zaključavanju imena lika!" });
  }
});

app.post('/api/scenarios/:scenarioId/characters/update', async (req, res) => {
  try {
    const scenarioId = parseInt(req.params.scenarioId);
    const { userId, oldName, newName } = req.body;

    const scenario = await Scenario.findByPk(scenarioId);
    if (!scenario) {
      return res.status(404).json({
        message: "Scenario ne postoji!"
      });
    }
    const lockIndex = locks.findIndex(l =>
      l.type === "character" &&
      l.scenarioId === scenarioId &&
      l.characterName === oldName
    );

    if (lockIndex === -1 || locks[lockIndex].userId !== userId) {
      return res.status(409).json({
        message: "Ime lika nije zakljucano od strane ovog korisnika!"
      });
    }
    const lines = await Line.findAll({
      where: { scenarioId }
    });
    const regex = new RegExp(`\\b${oldName}\\b`, 'g');
    for (const line of lines) {
      if (typeof line.text === "string") {
        const newText = line.text.replace(regex, newName);
        if (newText !== line.text) {
          line.text = newText;
          await line.save();
        }
      }
    }

    await Delta.create({
      scenarioId,
      type: "char_rename",
      oldName,
      newName,
      timestamp: Math.floor(Date.now() / 1000)
    });

    locks.splice(lockIndex, 1);

    res.status(200).json({
      message: "Ime lika je uspjesno promijenjeno!"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Greška pri ažuriranju imena lika!" });
  }
});

app.get('/api/scenarios/:scenarioId/deltas', async (req, res) => {
  try {
    const scenarioId = parseInt(req.params.scenarioId);
    const since = parseInt(req.query.since) || 0;

    const scenario = await Scenario.findByPk(scenarioId);
    if (!scenario) {
      return res.status(404).json({
        message: "Scenario ne postoji!"
      });
    }

    const deltas = await Delta.findAll({
      where: {
        scenarioId,
        timestamp: { [require('sequelize').Op.gt]: since }
      },
      order: [['timestamp', 'ASC']]
    });

    const response = deltas.map(d => ({
      scenarioId: d.scenarioId,
      type: d.type,
      lineId: d.lineId,
      nextLineId: d.nextLineId,
      content: d.content,
      oldName: d.oldName,
      newName: d.newName,
      timestamp: d.timestamp
    }));

    res.status(200).json({
      deltas: response
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Greška pri dohvatanju delti!" });
  }
});

app.get('/api/scenarios/:scenarioId', async (req, res) => {
  try {
    const scenarioId = parseInt(req.params.scenarioId);

    const scenario = await Scenario.findByPk(scenarioId, {
      include: [{ model: Line, as: 'content' }]
    });

    if (!scenario) {
      return res.status(404).json({
        message: "Scenario ne postoji!"
      });
    }

    const response = {
      id: scenario.id,
      title: scenario.title,
      content: scenario.content.map(l => ({
        lineId: l.lineId,
        nextLineId: l.nextLineId,
        text: l.text
      }))
    };

    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Greška pri dohvatanju scenarija!" });
  }
});