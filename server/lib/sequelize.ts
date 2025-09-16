import * as Path from "node:path";
import { Sequelize } from "sequelize";
import { initParticipant } from "../models/Participant";
import { initMessage } from "../models/Message";
import { initScene } from "../models/Scene";

let _sequelize: Sequelize | undefined;

/** Returns the global database connection manager  */
export async function sequelize(): Promise<Sequelize> {
  // Return already initialized singelton instance
  if (_sequelize) {
    return _sequelize;
  }

  // Set up the database path in the .dist directory
  const dbPath = Path.join(
    process.cwd(),
    ".dist",
    "database",
    CONFIG.isProduction ? "production-database.sqlite" : "dev-database.sqlite",
  );

  // Create Sequelize instance
  _sequelize = new Sequelize({
    dialect: "sqlite",
    storage: dbPath,
    logging: CONFIG.debug.verboseOutput ? console.log : false,
    define: {
      timestamps: true,
    },
  });

  // Authenticate
  await _sequelize.authenticate();

  // initialize models
  initParticipant(_sequelize);
  initMessage(_sequelize);
  initScene(_sequelize);

  // Sync all models with the database
  await _sequelize.sync();

  console.log("[Database] Connection has been established successfully.");
  return _sequelize;
}
