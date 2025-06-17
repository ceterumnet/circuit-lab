import type { CircuitComponent, Position } from '@/types/components';
import { getTerminalWorldPosition } from './geometry';

interface WireProperties {
  startTerminal: string;
  endTerminal: string;
  startComponentId: string;
  endComponentId: string;
}

// Helper function to calculate the 2D cross product of two vectors
function crossProduct(a: Position, b: Position): number {
  return a.x * b.y - a.y * b.x;
}

// Function to find the intersection point of two line segments
function getLineSegmentIntersection(p1: Position, p2: Position, p3: Position, p4: Position): Position | null {
  const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
  const v2 = { x: p4.x - p3.x, y: p4.y - p3.y };
  const v3 = { x: p3.x - p1.x, y: p3.y - p1.y };

  const denominator = crossProduct(v1, v2);

  // If the denominator is zero, the lines are parallel or collinear
  if (Math.abs(denominator) < 1e-9) {
    return null;
  }

  const t = crossProduct(v3, v2) / denominator;
  const u = crossProduct(v3, v1) / denominator;

  // The segments intersect if t and u are between 0 and 1 (inclusive)
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: p1.x + t * v1.x,
      y: p1.y + t * v1.y,
    };
  }

  return null;
}

// Main function to calculate all wire intersections in a circuit
export function calculateWireIntersections(components: readonly CircuitComponent[]): Map<string, Position[]> {
  const wires = components.filter(c => c.type === 'wire');
  const allComponents = new Map(components.map(c => [c.id, c]));
  const intersections = new Map<string, Position[]>();

  for (let i = 0; i < wires.length; i++) {
    for (let j = i + 1; j < wires.length; j++) {
      const wire1 = wires[i];
      const wire2 = wires[j];

      const w1p = wire1.properties as WireProperties | undefined;
      const w2p = wire2.properties as WireProperties | undefined;

      // Ensure properties exist and are of the correct type
      if (!w1p || !w2p) continue;

      const comp1Start = allComponents.get(w1p.startComponentId);
      const comp1End = allComponents.get(w1p.endComponentId);
      const comp2Start = allComponents.get(w2p.startComponentId);
      const comp2End = allComponents.get(w2p.endComponentId);

      if (!comp1Start || !comp1End || !comp2Start || !comp2End) continue;

      const p1 = getTerminalWorldPosition(comp1Start, w1p.startTerminal);
      const p2 = getTerminalWorldPosition(comp1End, w1p.endTerminal);
      const p3 = getTerminalWorldPosition(comp2Start, w2p.startTerminal);
      const p4 = getTerminalWorldPosition(comp2End, w2p.endTerminal);

      const intersectionPoint = getLineSegmentIntersection(p1, p2, p3, p4);

      if (intersectionPoint) {
        if (!intersections.has(wire1.id)) {
          intersections.set(wire1.id, []);
        }
        if (!intersections.has(wire2.id)) {
          intersections.set(wire2.id, []);
        }
        intersections.get(wire1.id)!.push(intersectionPoint);
        intersections.get(wire2.id)!.push(intersectionPoint);
      }
    }
  }

  return intersections;
}
