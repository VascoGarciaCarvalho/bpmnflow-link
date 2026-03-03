import { parseXML } from './parser.js';
import handlers from './handlers/index.js';

function getDocConfig(element) {
  if (!element.documentation || element.documentation.length === 0) return {};
  try {
    return JSON.parse(element.documentation[0].text);
  } catch {
    return {};
  }
}

export async function execute(xmlString) {
  const { flowElements } = await parseXML(xmlString);

  const startEvent = flowElements.find(el => el.$type === 'bpmn:StartEvent');
  if (!startEvent) throw new Error('No StartEvent found in process');

  const results = [];
  let current = startEvent;

  while (current) {
    const type = current.$type;

    if (type === 'bpmn:EndEvent') break;

    if (type === 'bpmn:ServiceTask') {
      const taskName = current.name;
      const handler = handlers[taskName];
      const config = getDocConfig(current);
      let output = null;
      let error = null;

      if (!handler) {
        error = `No handler registered for task name "${taskName}"`;
      } else {
        try {
          output = await handler({ taskId: current.id, name: taskName, config });
        } catch (e) {
          error = e.message;
        }
      }

      results.push({ taskId: current.id, name: taskName, output, error });
    }

    // Follow first outgoing sequence flow
    if (!current.outgoing || current.outgoing.length === 0) break;
    current = current.outgoing[0].targetRef;
  }

  return results;
}
