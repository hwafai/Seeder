const dotenv = require("dotenv");
const path = require("path");

const envFile = ".env.development";

dotenv.config({
  path: path.resolve(process.cwd(), envFile),
});
