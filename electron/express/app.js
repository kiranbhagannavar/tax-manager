// Load configurations
require("dotenv").config();

const app = require("express")();
const bodyParser = require("body-parser");
const path = require("path");
const passport = require("passport");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const cors = require("cors");
// Routes for the app
const auth = require("./routes/auth");
const houses = require("./routes/houses");
const sheets = require("./routes/sheet");
const taxes = require("./routes/taxes");

const sqlite = require("sqlite3").verbose();
// Models
const User = require("./models/User");

// Configure the sqlite database
const db = new sqlite.Database(
  path.resolve(__dirname, "db", "data.sqlite3"),
  sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE,
  err => {
    if (!err) {
      console.log("Connected to database...");
      createSchema();
    } else {
      console.error(`Unable to connect to database: ${err.message}`);
    }
  }
);

// Authentication with passport and JWT
passport.use(
  new JwtStrategy(
    {
      secretOrKey: process.env.secret || "secret",
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
    },
    (payload, done) => {
      User.findUserByUsername(db, payload.username)
        .then(user => {
          if (user) {
            return done(null, { username: user.username });
          } else {
            return done(null, false);
          }
        })
        .catch(err => {
          return done(err, null);
        });
    }
  )
);

// CORS module to allow cross site request
app.use(cors());
app.use(bodyParser.json());

module.exports = app;

// Routes for the app
app.use("/auth", auth);
app.use("/houses", passport.authenticate("jwt", { session: false }), houses);
app.use("/sheets", passport.authenticate("jwt", { session: false }), sheets);
app.use("/taxes", passport.authenticate("jwt", { session: false }), taxes);

// Set the database object
app.set("db", db);

app.listen(process.env.port || 3000, () => {
  console.log("Express server is up and running...");
  app.emit("listening");
});

function createSchema() {
  db.serialize(() => {
    // Users table creation
    db.run(
      `CREATE TABLE IF NOT EXISTS users (username STRING PRIMARY_KEY, password STRING)`
    );
    // Sheets table creation
    db.run(
      `CREATE TABLE IF NOT EXISTS sheets (id INT AUTO_INCREMENT PRIMARY_KEY, from_year INT, to_year INT)`
    );
    // Taxes table creation
    db.run(
      `CREATE TABLE IF NOT EXISTS taxes (id INT AUTO_INCREMENT PRIMARY_KEY, tax STRING)`
    );
    // Houses table creation
    db.run(
      `CREATE TABLE IF NOT EXISTS houses (id INT AUTO_INCREMENT PRIMARY_KEY, owner_name STRING, house_number STRING)`
    );
    // Payments table creation
    db.run(
      `CREATE TABLE IF NOT EXISTS payments (id INT AUTO_INCREMENT PRIMARY_KEY, sheet_id INT, house_id INT, tax_id INT, amount REAL, paid_amount REAL)`
    );
  });
}
