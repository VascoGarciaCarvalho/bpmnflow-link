# BPMNFlow Link

A BPMN process execution engine that connects diagrams to real technology actions — HTTP calls, database writes, email sending — with live visual feedback in the browser.

---

## How it works

You design a process in BPMN (using any standard tool like [bpmn.io](https://bpmn.io/)), load it into BPMNFlow Link, and click **Execute**. Each task in the diagram runs its configured action, and you watch the elements highlight in real time as execution progresses.

Handler configuration lives directly in the BPMN — inside the `<documentation>` element of each `ServiceTask`, as a JSON object.

---

## Stack

| Layer | Technology |
|---|---|
| Server | Node.js (ESM) + Express + TypeScript via `tsx` |
| BPMN parsing | `bpmn-moddle` v8 |
| Database | `node:sqlite` (built-in, Node 22+) |
| Frontend | React 18 + Vite 5 |
| Diagram viewer | bpmn-js (CDN) |
| Streaming | Server-Sent Events (SSE) |

---

## Requirements

- Node.js v22 or later (v25 recommended)
- npm

---

## Getting started

```bash
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

To test immediately, click **Load BPMN**, select `samples/sample.bpmn`, then click **Execute**.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Express (`:3000`) + Vite dev server (`:5173`) concurrently |
| `npm run build` | Build the React client into `dist/` |
| `npm start` | Run Express in production, serving the built `dist/` |

---

## Handlers

Tasks are matched by their BPMN `name` attribute. The following handlers are built in:

### `LogToConsole`

Prints a message to the server console.

```json
{ "message": "Hello from BPMN" }
```

Returns: `{ status, log, timestamp }`

---

### `CallAPI`

Makes an HTTP request using the native `fetch` API.

```json
{
  "url": "https://api.example.com/data",
  "method": "POST",
  "headers": { "Authorization": "Bearer token" },
  "body": { "key": "value" }
}
```

Returns: `{ status, statusText, body }`

---

### `UpdateDatabase`

Upserts a row in a local SQLite database (`data.db` at the project root). Creates the table and row automatically if they don't exist.

```json
{
  "table": "logs",
  "set": { "status": "done" },
  "where": { "id": "1" }
}
```

Returns: `{ changes, table, set, where }`

---

### `SendEmail`

Sends an email via SMTP using Nodemailer.

```json
{
  "to": "recipient@example.com",
  "subject": "Process completed",
  "text": "Your order has been processed.",
  "from": "noreply@example.com"
}
```

SMTP credentials can be passed in the config or set via environment variables:

```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=secret
```

Returns: `{ messageId, accepted, rejected }`

---

## ExclusiveGateway

Conditional branching is supported. Set the `conditionExpression` body on each outgoing sequence flow to a JavaScript expression that returns a boolean. The variable `ctx` holds the outputs of all previously executed tasks, keyed by element ID.

**Example condition** (on a sequence flow leaving a gateway):
```
ctx.Task_Log.status === 'ok'
```

The default flow (marked with a slash in BPMN editors) is used as a fallback if no other condition matches.

---

## Context passing between tasks

Every task's output is stored in the execution context under its element ID. You can reference previous outputs in any handler config using `{{ctx.ElementId.field}}` syntax.

**Example** — use the log message from a previous task as a URL parameter:
```json
{ "url": "https://api.example.com/{{ctx.Task_Log.status}}" }
```

---

## API endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/parse` | Parse a BPMN XML string, return detected `ServiceTask` list |
| `POST` | `/api/execute` | Execute the process, return all task results |
| `POST` | `/api/execute-stream` | Execute the process, stream events via SSE |

All endpoints accept `{ "xml": "<bpmn xml string>" }` in the request body.

---

## Adding a custom handler

1. Create `engine/handlers/myHandler.ts`:

```ts
import type { HandlerInput } from '../types.js'

export default async function myHandler({ config, context }: HandlerInput) {
  // your logic here
  return { result: 'done' }
}
```

2. Register it in `engine/handlers/index.ts`:

```ts
import myHandler from './myHandler.js'

export default {
  // ...existing handlers
  MyHandler: myHandler,
}
```

3. In your BPMN, name any `ServiceTask` `MyHandler` and put its config in the `<documentation>` element as JSON.

---

## Project structure

```
bpmnflow-link/
├── server.ts                  — Express server + API routes
├── tsconfig.json              — TypeScript config (server + engine)
├── vite.config.ts             — Vite config (client build)
│
├── engine/
│   ├── types.ts               — Shared TypeScript interfaces
│   ├── parser.ts              — BPMN XML → flow elements
│   ├── executor.ts            — Process traversal + SSE emission
│   ├── context.ts             — Execution variable store
│   ├── interpolate.ts         — {{ctx.X.Y}} resolver
│   └── handlers/
│       ├── index.ts           — Handler registry
│       ├── logToConsole.ts
│       ├── callAPI.ts
│       ├── updateDatabase.ts
│       └── sendEmail.ts
│
├── client/                    — React + Vite frontend
│   ├── index.html
│   └── src/
│       ├── App.tsx
│       ├── components/
│       │   ├── DiagramViewer.tsx   — bpmn-js wrapper with highlighting
│       │   ├── TaskList.tsx
│       │   └── ExecutionPanel.tsx  — Live SSE results
│       └── hooks/
│           └── useExecutionStream.ts
│
└── samples/
    └── sample.bpmn            — Example process (LogToConsole → CallAPI → UpdateDatabase)
```
