import Path from 'path'

// Server options

/** Indicates that this is a run while the solution is still in development */
export const IS_DEVELOPMENT = process.env.NODE_ENV != 'production'

/** The port to run the http server at */
export const PORT = 3000

/** Where to store singleton information between runs  */
export const SINGLETON_PATH = (id: string) =>
  Path.resolve(process.cwd(), `.dist/singeltons/${id}`)

/** The directory to use for builds */
export const OUT_DIR = Path.resolve(process.cwd(), '.dist', 'ui')
