const handleSignin = (db, bcrypt) => (req, res) => {
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
};

export { handleSignin };
