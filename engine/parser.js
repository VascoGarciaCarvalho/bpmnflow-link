import BpmnModdle from 'bpmn-moddle';

const moddle = new BpmnModdle();

export async function parseXML(xmlString) {
  const { rootElement: definitions } = await moddle.fromXML(xmlString);
  const process = definitions.rootElements.find(el => el.$type === 'bpmn:Process');
  if (!process) throw new Error('No bpmn:Process found in the file');
  const flowElements = process.flowElements || [];
  return { definitions, process, flowElements };
}
