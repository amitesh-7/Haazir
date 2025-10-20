import { Sequelize } from "sequelize";
import * as dns from "dns";
import * as dotenv from "dotenv";

dotenv.config();

let sequelize: Sequelize;

// Force IPv4 resolution to avoid IPv6 connectivity issues
try {
  dns.setDefaultResultOrder?.("ipv4first");
} catch {}

// PostgreSQL (Supabase) configuration
const databaseUrl = process.env.DATABASE_URL;

// SSL options for Supabase
const sslRequired =
  String(process.env.DB_SSL || "true").toLowerCase() === "true";
const rejectUnauthorized =
  String(process.env.DB_SSL_REJECT_UNAUTHORIZED || "false").toLowerCase() ===
  "true";

// Disable TLS rejection for development
if (!rejectUnauthorized) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

// Enhanced connection options for better reliability
const buildDialectOptions = () => {
  const opts: any = {
    // Force IPv4 resolution
    lookup: (hostname: string, options: any, callback: any) => {
      dns.lookup(hostname, { family: 4 }, callback);
    },
    // Connection timeout and retry settings
    connectTimeout: 30000,
    acquireTimeout: 30000,
    timeout: 30000,
  };

  if (sslRequired) {
    opts.ssl = {
      require: true,
      rejectUnauthorized,
      // Additional SSL options for Supabase
      ca: undefined,
    };
  }

  return opts;
};

const commonOptions = {
  dialect: "postgres" as const,
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
  },
  dialectOptions: buildDialectOptions(),
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  retry: {
    max: 3,
  },
  // Force IPv4 for the main connection
  host: databaseUrl ? undefined : process.env.DB_HOST || "localhost",
};

if (databaseUrl) {
  sequelize = new Sequelize(databaseUrl, commonOptions);
} else {
  sequelize = new Sequelize({
    ...commonOptions,
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "postgres",
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "password",
  });
}

export { sequelize };
export default sequelize;
