import type { Position } from '@/types/components';
import { useInteractionStore } from '@/stores/interaction';

/**
 * Converts screen coordinates (e.g., from a mouse event) to world coordinates,
 * accounting for the canvas's current pan and zoom state.
 * @param position - The screen position (e.g., { x: event.clientX, y: event.clientY }).
 * @returns The corresponding position in the world coordinate system.
 */
export function screenToWorld(position: Position): Position {
  const interactionStore = useInteractionStore();
  const { scale, position: canvasPos } = interactionStore.canvasTransform;

  return {
    x: (position.x - canvasPos.x) / scale,
    y: (position.y - canvasPos.y) / scale,
  };
}

/**
 * Converts world coordinates (e.g., a component's position) to screen coordinates.
 * This is useful for positioning UI elements on top of the canvas.
 * @param position - The world position.
 * @returns The corresponding position on the screen.
 */
export function worldToScreen(position: Position): Position {
  const interactionStore = useInteractionStore();
  const { scale, position: canvasPos } = interactionStore.canvasTransform;

  return {
    x: position.x * scale + canvasPos.x,
    y: position.y * scale + canvasPos.y,
  };
}
