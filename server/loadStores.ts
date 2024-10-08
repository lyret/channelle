export function loadStores(
	...stores: Array<{ subscribe: (handler: any) => () => void }>
) {}
