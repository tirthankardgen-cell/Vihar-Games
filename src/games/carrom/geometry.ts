// One source for the painted openings, simulation, computer targets and guide.
export const boardEdge = 29;
export const boardFarEdge = 600 - boardEdge;
export const pocketRadius = 23;
const near = boardEdge + pocketRadius;
const far = boardFarEdge - pocketRadius;
export const pockets: readonly (readonly [number, number])[] = [[near, near], [far, near], [near, far], [far, far]];
