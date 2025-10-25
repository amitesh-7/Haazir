import { Sequelize } from "sequelize";
import * as dns from "dns";
import * as dotenv from "dotenv";
import pg from "pg";

dotenv.config();

let sequelize: Sequelize;

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
    lookup: (hostname: string, options: any, callback: any) => {
      const cb = typeof options === "function" ? options : callback;
      const baseOptions =
        typeof options === "object" && options ? { ...options } : {};

      // Try IPv4 first, fall back to IPv6 to support IPv6-only hosts (e.g. Supabase)
      dns.lookup(
        hostname,
        { ...baseOptions, family: 4 },
        (err4, address4, family4) => {
          if (!err4 && address4) {
            return cb(null, address4, family4);
          }

          console.warn(
            `[DB] IPv4 DNS lookup failed for ${hostname}: ${
              err4?.message || err4
            }`
          );

          dns.lookup(
            hostname,
            { ...baseOptions, family: 6 },
            (err6, address6, family6) => {
              if (!err6 && address6) {
                return cb(null, address6, family6);
              }

              console.warn(
                `[DB] IPv6 DNS lookup via dns.lookup failed for ${hostname}: ${
                  err6?.message || err6
                }`
              );

              dns.resolve6(hostname, (errResolve6, addresses6) => {
                if (
                  !errResolve6 &&
                  Array.isArray(addresses6) &&
                  addresses6.length > 0
                ) {
                  return cb(null, addresses6[0], 6);
                }

                console.error(
                  `[DB] Unable to resolve IPv6 address for ${hostname}: ${
                    errResolve6?.message || errResolve6 || err6 || err4
                  }`
                );

                cb(errResolve6 || err6 || err4);
              });
            }
          );
        }
      );
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
  dialectModule: pg,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  retry: {
    max: 3,
  },
  // Local development fallback when DATABASE_URL is not provided
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
