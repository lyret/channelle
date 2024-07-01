import { Repository } from './_repository';

/** All available data repositories */
export const Repositories = {
	participant: new Repository('Participant', 'id'),
	test: new Repository('Test', 'id'),
};
