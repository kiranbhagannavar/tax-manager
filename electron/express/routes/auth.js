const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

router.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const db = req.app.get("db");

  User.findUserByUsername(db, username)
    .then(user => {
      if (user.password == password) {
        // Authentiacate user
        jwt.sign(
          { username: username },
          process.env.secret || "secret",
          (err, token) => {
            if (!err) {
              res.json({ error: false, token: token });
            } else {
              res.json({ error: err });
            }
          }
        );
      } else {
        res.json({ error: "Invalid username or password" });
      }
    })
    .catch(err => {
      res.json({ error: err });
    });
});

module.exports = router;