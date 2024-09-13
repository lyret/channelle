import UniversalRouter, {
	type RouteContext,
	type RouterContext,
} from 'universal-router';
import generateUrls from 'universal-router/generateUrls';

// ROUTES CONFIG

export interface Route<Params = {}> extends RouteConfig<Params> {
	name: RouteName;
}

export interface RouteConfig<Params = {}> {
	path: string;
	group: string;
	params: Params;
}

const route: <Params = {}>(
	path: string,
	group?: string
) => RouteConfig<Params> = (path, group = '') => ({
	path: path,
	group: group,
	params: {} as any,
});

const routes = <const>{
	stage: route('/', 'stage'),
	backstage: route('/backstage', 'backstage'),
};

export const defaultRoute = routes['foyer'];

export const router = new UniversalRouter(
	Object.entries(routes).map((entry) => {
		const [name, config] = entry;
		return {
			//children: []
			name,
			path: config.path,
			action: (c: RouteContext<any, RouterContext>) => ({
				name,
				path: config.path,
				params: c.params,
				group: config.group,
			}),
		};
	})
);
const generator = generateUrls(router);

export type RouteName = keyof typeof routes;

export const gotoRoute = <
	K extends RouteName,
	Entry extends (typeof routes)[K],
>(
	key: K,
	params: Entry['params'] = {},
	options: { reload?: boolean } = {}
) => {
	const url = generator(key, params);
	history.pushState(null, `Channelle - ${key}`, url);
	if (options.reload) {
		location.reload();
	}
};

export const replaceRoute = <
	K extends RouteName,
	Entry extends (typeof routes)[K],
>(
	key: K,
	params: Entry['params'] = {}
) => {
	const url = generator(key, params);
	history.replaceState(null, `Channelle - ${key}`, url);
};

export const linkTo =
	<K extends RouteName, Entry extends (typeof routes)[K]>(
		key: K,
		params: Entry['params'] = {}
	) =>
	() =>
		gotoRoute(key, params);
