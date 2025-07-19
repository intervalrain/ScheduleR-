/**
 * Sparse Priority Sorting Algorithm
 * 
 * This algorithm maintains spaced priority values to allow easy reordering
 * without constantly updating all items.
 */

export const INITIAL_PRIORITY = 1000000000;
export const PRIORITY_GAP = 100;

/**
 * Calculate priority for a new item
 * @param existingPriorities - Array of existing priorities in descending order
 * @param position - 'higher' or 'lower' relative to the reference
 * @param referencePriority - The priority to position relative to
 */
export function calculateNewPriority(
  existingPriorities: number[],
  position: 'higher' | 'lower',
  referencePriority?: number
): number {
  if (existingPriorities.length === 0) {
    return INITIAL_PRIORITY;
  }

  const refPriority = referencePriority || existingPriorities[0];
  
  if (position === 'higher') {
    return refPriority + PRIORITY_GAP;
  } else {
    return refPriority - PRIORITY_GAP;
  }
}

/**
 * Calculate priority when dragging an item to a new position
 * @param priorities - Array of all priorities in descending order
 * @param fromIndex - Original index of the item
 * @param toIndex - Target index for the item
 */
export function calculateDragPriority(
  priorities: number[],
  fromIndex: number,
  toIndex: number
): number {
  // Remove the item being moved from the array
  const prioritiesWithoutItem = [...priorities];
  prioritiesWithoutItem.splice(fromIndex, 1);

  // If moving to the first position (highest priority)
  if (toIndex === 0) {
    return prioritiesWithoutItem[0] + PRIORITY_GAP;
  }

  // If moving to the last position (lowest priority)
  if (toIndex >= prioritiesWithoutItem.length) {
    return prioritiesWithoutItem[prioritiesWithoutItem.length - 1] - PRIORITY_GAP;
  }

  // Moving between two items
  const higherPriority = prioritiesWithoutItem[toIndex - 1];
  const lowerPriority = prioritiesWithoutItem[toIndex];
  
  return Math.floor((higherPriority + lowerPriority) / 2);
}

/**
 * Check if priorities need rebalancing (when two adjacent items have the same priority)
 * @param priorities - Array of priorities in descending order
 */
export function needsRebalancing(priorities: number[]): boolean {
  for (let i = 0; i < priorities.length - 1; i++) {
    if (priorities[i] === priorities[i + 1]) {
      return true;
    }
  }
  return false;
}

/**
 * Rebalance all priorities with the middle item at INITIAL_PRIORITY
 * @param count - Number of items to rebalance
 */
export function rebalancePriorities(count: number): number[] {
  if (count === 0) return [];
  if (count === 1) return [INITIAL_PRIORITY];

  const result: number[] = [];
  const middleIndex = Math.floor(count / 2);

  for (let i = 0; i < count; i++) {
    const offset = (middleIndex - i) * PRIORITY_GAP;
    result.push(INITIAL_PRIORITY + offset);
  }

  return result;
}

/**
 * Sort items by priority in descending order (higher priority first)
 */
export function sortByPriorityDescending<T extends { priority?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const priorityA = a.priority ?? INITIAL_PRIORITY;
    const priorityB = b.priority ?? INITIAL_PRIORITY;
    return priorityB - priorityA; // Descending order
  });
}