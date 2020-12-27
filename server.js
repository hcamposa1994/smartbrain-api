import dotenv from "dotenv";
import express from "express";
import bcrypt from "bcryptjs";
import cors from "cors";
import knex from "knex";

dotenv.config();

const db = knex({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    user: "herbert",
    password: process.env.DB_PASS,
    database: "smart-brain",
  },
});

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("success");
});

app.post("/signin", (req, res) => {
  db.select("email", "hash")
    .where("email", "=", req.body.email)
    .from("login")
    .then((data) => {
      bcrypt.compare(req.body.password, data[0].hash, function (err, response) {
        if (response) {
          return db
            .select()
            .from("users")
            .where("email", "=", req.body.email)
            .then((user) => {
              res.json(user[0]);
            })
            .catch((err) => res.status(400).json("unable to get user"));
        } else {
          res.status(400).json("wrong credentials");
        }
      });
    })
    .catch((err) => res.status(400).json("wrong credentials"));
});

app.post("/register", (req, res) => {
  const { email, name, password } = req.body;

  bcrypt.hash(password, 10, function (err, hash) {
    db.transaction((trx) => {
      trx
        .insert({
          hash: hash,
          email: email,
        })
        .into("login")
        .returning("email")
        .then((loginEmail) => {
          return trx("users")
            .returning("*")
            .insert({
              email: loginEmail[0],
              name: name,
              joined: new Date(),
            })
            .then((user) => {
              res.json(user[0]);
            });
        })
        .then(trx.commit)
        .catch(trx.rollback);
    }).catch((err) => res.status(400).json("unable to register"));
  });
});

app.get("/profile/:id", (req, res) => {
  const { id } = req.params;
  db.select()
    .from("users")
    .where({ id })
    .then((user) => {
      if (user.length) {
        res.json(user[0]);
      } else {
        res.status(400).json("Not found");
      }
    })
    .catch((err) => res.status(400).json("error getting user"));
});

app.put("/image", (req, res) => {
  const { id } = req.body;
  db("users")
    .where("id", "=", id)
    .increment("entries", 1)
    .returning("entries")
    .then((entries) => {
      res.json(entries[0]);
    })
    .catch((err) => res.status(400).json("unable to get entries"));
});

app.listen(3000, () => {
  console.log("app is running on port 3000");
});
