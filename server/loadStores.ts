/* eslint-disable @typescript-eslint/no-unused-vars */
 
export function loadStores(
	...stores: Array<{ subscribe: (handler: any) => () => void }>
) {}
