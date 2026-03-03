import express from 'express';
import { parseXML } from './engine/parser.js';
import { execute } from './engine/executor.js';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '5mb' }));
app.use(express.static('public'));

// POST /api/parse — returns list of tasks found in the BPMN
app.post('/api/parse', async (req, res) => {
  const { xml } = req.body;
  if (!xml) return res.status(400).json({ error: 'Missing "xml" in request body' });

  try {
    const { flowElements } = await parseXML(xml);
    const tasks = flowElements
      .filter(el => el.$type === 'bpmn:ServiceTask')
      .map(el => ({ id: el.id, name: el.name, type: el.$type }));
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/execute — runs the full process and returns results per task
app.post('/api/execute', async (req, res) => {
  const { xml } = req.body;
  if (!xml) return res.status(400).json({ error: 'Missing "xml" in request body' });

  try {
    const results = await execute(xml);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`BPMNFlow Link running at http://localhost:${PORT}`);
});
