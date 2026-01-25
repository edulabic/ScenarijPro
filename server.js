const path = require("path");

const sequelize = require("./baza");   
const { Scenario, Line, Delta, Checkpoint } = require("./models/index.js");

const express = require("express");
const app = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, 'html')));
app.use(express.static(__dirname));

async function initializeTestData() {
  try {
   
    await Delta.destroy({ where: {} });
    await Line.destroy({ where: {} });
    await Checkpoint.destroy({ where: {} });
    await Scenario.destroy({ where: {} });

    const scenario = await Scenario.create({ 
      title: 'Potraga za izgubljenim ključem' 
    });
    
    const scenarioId = scenario.id;
    
    const lines = [
      {
        lineId: 1,
        nextLineId: 2,
        text: "NARATOR: Sunce je polako zalazilo nad starim gradom."
      },
      {
        lineId: 2,
        nextLineId: 3,
        text: "ALICE: Jesi li siguran da je ključ ostao u biblioteci?"
      },
      {
        lineId: 3,
        nextLineId: 4,
        text: "BOB: To je posljednje mjesto gdje sam ga vidio prije nego što je pala noć."
      },
      {
        lineId: 4,
        nextLineId: 5,
        text: "ALICE: Moramo požuriti prije nego što čuvar zaključa glavna vrata."
      },
      {
        lineId: 5,
        nextLineId: 6,
        text: "BOB: Čekaj, čuješ li taj zvuk iza polica?"
      },
      {
        lineId: 6,
        nextLineId: null,
        text: "NARATOR: Iz sjene se polako pojavila nepoznata figura."
      }
    ];

    for (const line of lines) {
      await Line.create({
        scenarioId: scenarioId,
        lineId: line.lineId,
        nextLineId: line.nextLineId,
        text: line.text
      });
    }

    const deltas = [
      {
        scenarioId: scenarioId,
        type: "line_update",
        lineId: 1,
        nextLineId: 2,
        content: "NARATOR: Sunce je polako zalazilo nad starim gradom.",
        timestamp: 1736520000
      },
      {
        scenarioId: scenarioId,
        type: "line_update",
        lineId: 2,
        nextLineId: 3,
        content: "ALICE: Jesi li siguran da je ključ ostao u biblioteci?",
        timestamp: 1736520010
      },
      {
        scenarioId: scenarioId,
        type: "line_update",
        lineId: 3,
        nextLineId: 4,
        content: "BOB: To je posljednje mjesto gdje sam ga vidio prije nego što je pala noć.",
        timestamp: 1736520020
      },
      {
        scenarioId: scenarioId,
        type: "line_update",
        lineId: 4,
        nextLineId: 5,
        content: "ALICE: Moramo požuriti prije nego što čuvar zaključa glavna vrata.",
        timestamp: 1736520030
      },
      {
        scenarioId: scenarioId,
        type: "line_update",
        lineId: 5,
        nextLineId: 6,
        content: "BOB: Čekaj, čuješ li taj zvuk iza polica?",
        timestamp: 1736520040
      },
      {
        scenarioId: scenarioId,
        type: "line_update",
        lineId: 6,
        nextLineId: null,
        content: "NARATOR: Iz sjene se polako pojavila nepoznata figura.",
        timestamp: 1736520050
      },
      {
        scenarioId: scenarioId,
        type: "char_rename",
        oldName: "BOB",
        newName: "ROBERT",
        timestamp: 1736520100
      }
    ];

    for (const delta of deltas) {
      await Delta.create(delta);
    }
    
    console.log(`Test data initialized successfully with scenario ID: ${scenarioId}`);
  } catch (err) {
    console.error("Error pri inicijalizaciji:", err);
  }
}

sequelize.sync({ force: true })
  .then(async () => {
    await initializeTestData();
    app.listen(3000, () => {
      console.log("Server running on http://localhost:3000");
    });
  })
  .catch(err => {
    console.error("Greska prije sync:", err);
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

    // GLOBALNO ZAKLJUČAVANJE: Otključaj SVE linije ovog korisnika u ovom scenariju
    locks = locks.filter(l => !(l.scenarioId === scenarioId && l.userId === userId && !l.type));
    
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
    
    // CASE-SENSITIVE regex - bez 'i' flaga
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

app.post('/api/scenarios/:scenarioId/checkpoint', async (req, res) => {
  try {
    const scenarioId = parseInt(req.params.scenarioId);

    const scenario = await Scenario.findByPk(scenarioId);
    if (!scenario) {
      return res.status(404).json({
        message: "Scenario ne postoji!"
      });
    }

    await Checkpoint.create({
      scenarioId,
      timestamp: Math.floor(Date.now() / 1000)
    });

    res.status(200).json({
      message: "Checkpoint je uspjesno kreiran!"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Greška pri kreiranju checkpointa!" });
  }
});

app.get('/api/scenarios/:scenarioId/checkpoints', async (req, res) => {
  try {
    const scenarioId = parseInt(req.params.scenarioId);

    const scenario = await Scenario.findByPk(scenarioId);
    if (!scenario) {
      return res.status(404).json({
        message: "Scenario ne postoji!"
      });
    }

    const checkpoints = await Checkpoint.findAll({
      where: { scenarioId },
      order: [['timestamp', 'ASC']]
    });

    const response = checkpoints.map(c => ({
      id: c.id,
      timestamp: c.timestamp
    }));

    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Greška pri dohvatanju checkpointa!" });
  }
});

app.get('/api/scenarios/:scenarioId/restore/:checkpointId', async (req, res) => {
  try {
    const scenarioId = parseInt(req.params.scenarioId);
    const checkpointId = parseInt(req.params.checkpointId);

    const checkpoint = await Checkpoint.findByPk(checkpointId);
    if (!checkpoint || checkpoint.scenarioId !== scenarioId) {
      return res.status(404).json({
        message: "Checkpoint ne postoji!"
      });
    }

    const scenario = await Scenario.findByPk(scenarioId);
    if (!scenario) {
      return res.status(404).json({
        message: "Scenario ne postoji!"
      });
    }

    let lines = await Line.findAll({
      where: { scenarioId },
      order: [['lineId', 'ASC']]
    });

    let content = lines.map(l => ({
      lineId: l.lineId,
      nextLineId: l.nextLineId,
      text: l.text
    }));

    const deltas = await Delta.findAll({
      where: {
        scenarioId,
        timestamp: {
          [require('sequelize').Op.lte]: checkpoint.timestamp
        }
      },
      order: [['timestamp', 'ASC']]
    });

    for (const d of deltas) {
      if (d.type === "line_update") {
        const line = content.find(l => l.lineId === d.lineId);
        if (line) {
          line.text = d.content;
          line.nextLineId = d.nextLineId;
        }
      }

      if (d.type === "char_rename") {
        content.forEach(l => {
          if (typeof l.text === "string") {
            const regex = new RegExp(`\\b${d.oldName}\\b`, 'g');
            l.text = l.text.replace(regex, d.newName);
          }
        });
      }
    }

    res.status(200).json({
      id: scenario.id,
      title: scenario.title,
      content
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Greška pri restore operaciji!" });
  }
});