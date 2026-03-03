/* global BpmnJS */
(function () {
  'use strict';

  // ── DOM refs ──────────────────────────────────────────────────────────────
  const dropZone   = document.getElementById('drop-zone');
  const fileInput  = document.getElementById('file-input');
  const canvas     = document.getElementById('canvas');
  const btnExecute = document.getElementById('btn-execute');
  const btnFit     = document.getElementById('btn-fit');
  const taskList   = document.getElementById('task-list');
  const resultList = document.getElementById('result-list');

  // ── bpmn-js viewer ───────────────────────────────────────────────────────
  const viewer = new BpmnJS({ container: canvas });
  let currentXML = null;

  // ── Drag-and-drop ────────────────────────────────────────────────────────
  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));

  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) loadFile(fileInput.files[0]);
  });

  // ── File loading ─────────────────────────────────────────────────────────
  function loadFile(file) {
    const reader = new FileReader();
    reader.onload = async e => {
      const xml = e.target.result;
      await processXML(xml);
    };
    reader.readAsText(file);
  }

  async function processXML(xml) {
    currentXML = xml;
    resetResults();

    // Render diagram
    try {
      await viewer.importXML(xml);
      viewer.get('canvas').zoom('fit-viewport');
      canvas.classList.add('visible');
      dropZone.classList.add('has-diagram');
      btnExecute.disabled = false;
      btnFit.disabled = false;
    } catch (err) {
      showError(taskList, 'Failed to render diagram: ' + err.message);
    }

    // Detect tasks via /api/parse
    try {
      const data = await apiFetch('/api/parse', { xml });
      renderTaskList(data.tasks);
    } catch (err) {
      showError(taskList, 'Parse error: ' + err.message);
    }
  }

  // ── Button actions ────────────────────────────────────────────────────────
  btnFit.addEventListener('click', () => {
    viewer.get('canvas').zoom('fit-viewport');
  });

  btnExecute.addEventListener('click', async () => {
    if (!currentXML) return;
    btnExecute.disabled = true;
    btnExecute.textContent = 'Running…';
    resultList.innerHTML = '<li class="empty">Executing…</li>';

    try {
      const data = await apiFetch('/api/execute', { xml: currentXML });
      renderResults(data.results);
    } catch (err) {
      showError(resultList, 'Execution error: ' + err.message);
    } finally {
      btnExecute.disabled = false;
      btnExecute.textContent = 'Execute Process';
    }
  });

  // ── Render helpers ────────────────────────────────────────────────────────
  function renderTaskList(tasks) {
    if (!tasks || tasks.length === 0) {
      taskList.innerHTML = '<li class="empty">No Service Tasks found</li>';
      return;
    }
    taskList.innerHTML = tasks.map(t =>
      `<li class="task-item">
        <span class="task-name">${escHtml(t.name || t.id)}</span>
        <span class="task-id">${escHtml(t.id)}</span>
      </li>`
    ).join('');
  }

  function renderResults(results) {
    if (!results || results.length === 0) {
      resultList.innerHTML = '<li class="empty">No tasks executed</li>';
      return;
    }
    resultList.innerHTML = results.map(r => {
      const ok = !r.error;
      const statusClass = ok ? 'result-ok' : 'result-error';
      const statusIcon  = ok ? '✓' : '✗';
      const detail = ok
        ? `<pre>${escHtml(JSON.stringify(r.output, null, 2))}</pre>`
        : `<pre class="error-detail">${escHtml(r.error)}</pre>`;
      return `<li class="result-item ${statusClass}">
        <div class="result-header">
          <span class="result-icon">${statusIcon}</span>
          <span class="result-name">${escHtml(r.name || r.taskId)}</span>
          <span class="result-id">${escHtml(r.taskId)}</span>
        </div>
        <details>
          <summary>${ok ? 'Output' : 'Error'}</summary>
          ${detail}
        </details>
      </li>`;
    }).join('');
  }

  function resetResults() {
    taskList.innerHTML   = '<li class="empty">Parsing…</li>';
    resultList.innerHTML = '<li class="empty">Click "Execute Process" to run</li>';
  }

  function showError(container, msg) {
    container.innerHTML = `<li class="result-error">${escHtml(msg)}</li>`;
  }

  function escHtml(str) {
    if (str === undefined || str === null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── API helper ────────────────────────────────────────────────────────────
  async function apiFetch(path, body) {
    const res = await fetch(path, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || res.statusText);
    return json;
  }
})();
