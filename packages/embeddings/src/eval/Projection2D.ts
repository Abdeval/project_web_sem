import { EmbeddingPoint2D } from '@kg/core';
import { ProjectionInput } from '../types';

function pointFromVector(id: string, vector: number[], kind: 'entity' | 'relation'): EmbeddingPoint2D {
    return {
        id,
        x: vector[0] ?? 0,
        y: vector[1] ?? 0,
        kind,
    };
}

export class Projection2D {
    project(input: ProjectionInput, maxEntities: number = 80, maxRelations: number = 30): EmbeddingPoint2D[] {
        const points: EmbeddingPoint2D[] = [];

        const entityIds = input.entities.slice(0, maxEntities);
        for (const id of entityIds) {
            points.push(pointFromVector(id, input.entityEmbeddings[id] ?? [], 'entity'));
        }

        const relationIds = input.relations.slice(0, maxRelations);
        for (const id of relationIds) {
            points.push(pointFromVector(id, input.relationEmbeddings[id] ?? [], 'relation'));
        }

        return points;
    }
}
