import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Position } from '@/types/components'

vi.mock('@/stores/interaction', () => ({
  useInteractionStore: vi.fn(),
}))

vi.mock('@/registry/components', () => ({}))

import { useInteractionStore } from '@/stores/interaction'
import { screenToWorld, worldToScreen } from '../coordinates'

const mockedStore = vi.mocked(useInteractionStore)

function setTransform(scale: number, position: Position) {
  mockedStore.mockReturnValue({
    canvasTransform: { scale, position },
  } as ReturnType<typeof useInteractionStore>)
}

beforeEach(() => {
  vi.clearAllMocks()
  setTransform(1, { x: 0, y: 0 })
})

describe('screenToWorld', () => {
  it('identity transform', () => {
    const result = screenToWorld({ x: 100, y: 200 })
    expect(result).toEqual({ x: 100, y: 200 })
  })

  it('scale only', () => {
    setTransform(2, { x: 0, y: 0 })
    const result = screenToWorld({ x: 100, y: 200 })
    expect(result).toEqual({ x: 50, y: 100 })
  })

  it('pan only', () => {
    setTransform(1, { x: 100, y: 100 })
    const result = screenToWorld({ x: 100, y: 200 })
    expect(result).toEqual({ x: 0, y: 100 })
  })

  it('both scale and pan', () => {
    setTransform(2, { x: 100, y: 100 })
    const result = screenToWorld({ x: 300, y: 500 })
    expect(result).toEqual({ x: 100, y: 200 })
  })

  it('zero scale produces Infinity', () => {
    setTransform(0, { x: 0, y: 0 })
    const result = screenToWorld({ x: 100, y: 200 })
    expect(result.x).toBe(Infinity)
    expect(result.y).toBe(Infinity)
  })
})

describe('worldToScreen', () => {
  it('identity transform', () => {
    const result = worldToScreen({ x: 100, y: 200 })
    expect(result).toEqual({ x: 100, y: 200 })
  })

  it('scale only', () => {
    setTransform(2, { x: 0, y: 0 })
    const result = worldToScreen({ x: 50, y: 100 })
    expect(result).toEqual({ x: 100, y: 200 })
  })

  it('pan only', () => {
    setTransform(1, { x: 100, y: 100 })
    const result = worldToScreen({ x: 0, y: 100 })
    expect(result).toEqual({ x: 100, y: 200 })
  })

  it('both scale and pan', () => {
    setTransform(2, { x: 100, y: 100 })
    const result = worldToScreen({ x: 100, y: 200 })
    expect(result).toEqual({ x: 300, y: 500 })
  })

  it('negative coordinates', () => {
    setTransform(1.5, { x: 50, y: 50 })
    const result = worldToScreen({ x: -10, y: -20 })
    expect(result).toEqual({ x: 35, y: 20 })
  })
})

describe('round trip', () => {
  it('screenToWorld(worldToScreen(x)) === x', () => {
    setTransform(2, { x: 100, y: 100 })
    const world = { x: 100, y: 200 }
    const screen = worldToScreen(world)
    const back = screenToWorld(screen)
    expect(back).toEqual(world)
  })

  it('worldToScreen(screenToWorld(x)) === x', () => {
    setTransform(0.5, { x: -50, y: -50 })
    const screen = { x: 200, y: 300 }
    const world = screenToWorld(screen)
    const back = worldToScreen(world)
    expect(back).toEqual(screen)
  })
})
