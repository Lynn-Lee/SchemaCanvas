import { describe, expect, it } from 'vitest';
import { createBasicDiagramFixture } from './diagramFixtures';

describe('createBasicDiagramFixture', () => {
  it('creates an isolated local-first diagram fixture with one table', () => {
    const diagram = createBasicDiagramFixture();
    const anotherDiagram = createBasicDiagramFixture();

    expect(diagram).toMatchObject({
      id: expect.any(String),
      name: 'Local test diagram',
      database: 'generic',
      tables: [
        {
          id: expect.any(String),
          name: 'users',
          fields: [
            {
              id: expect.any(String),
              name: 'id',
              type: 'integer',
              primary: true,
            },
          ],
        },
      ],
      relationships: [],
    });
    expect(diagram).not.toBe(anotherDiagram);
    expect(diagram.tables[0]).not.toBe(anotherDiagram.tables[0]);
  });
});
