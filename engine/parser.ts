import BpmnModdle from 'bpmn-moddle'

const moddle = new BpmnModdle()

export async function parseXML(xmlString: string) {
  const { rootElement: definitions } = await moddle.fromXML(xmlString)
  const process = (definitions as any).rootElements.find(
    (el: any) => el.$type === 'bpmn:Process'
  )
  if (!process) throw new Error('No bpmn:Process found in the file')
  const flowElements: any[] = process.flowElements || []
  return { definitions, process, flowElements }
}
