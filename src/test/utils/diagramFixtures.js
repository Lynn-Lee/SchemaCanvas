import basicLocalDiagram from '../fixtures/diagrams/basic-local-diagram.json';

const cloneFixture = (fixture) => JSON.parse(JSON.stringify(fixture));

export const createBasicDiagramFixture = () => cloneFixture(basicLocalDiagram);
