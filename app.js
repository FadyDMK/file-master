require("dotenv").config();
const express = require("express");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const app = express();
const port = process.env.PORT || 3000;
const path = require("path");
const session = require("express-session");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { Pool } = require("pg");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const helmet = require("helmet");
const uploadMulter = multer({ dest: "uploads/" });


app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(helmet());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(
  session({
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // ms
    },
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    store: new PrismaSessionStore(new PrismaClient(), {
      checkPeriod: 2 * 60 * 1000, //ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  })
);

app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: {
            email: email,
          },
        });

        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }
        if (!(await bcrypt.compare(password, user.password))) {
          return done(null, false, { message: "Incorrect password" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
    });

    done(null, user);
  } catch (err) {
    done(err);
  }
});

app.get("/", (req, res) => {
  res.render("index", { user: req.user });
});

app.get("/files", async (req, res) => {
  const userFiles = await prisma.user.findUnique({
    where: {
      id: req.user.id,
    },
    include: {
      Post: true, 
    },
  });
  console.log(userFiles.Post);
  res.render("files", { files: userFiles.Post || [] , user: req.user});
});
app.get("/download/:id", async (req, res) => {
  const file = await prisma.file.findUnique({
    where: {
      id: parseInt(req.params.id),
    },
  });
  res.download(file.path);
  res.redirect("/files");
})
app.get("/sign-up", (req, res) => res.render("sign-up-form"));
app.get("/log-in", (req, res) => res.render("log-in"));
app.get("/log-out", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.post("/sign-up", async (req, res, next) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    await prisma.user.create({
      data: {
        name: req.body.username,
        password: hashedPassword,
        email: req.body.email,
      },
    });

    res.redirect("/");
  } catch (err) {
    return next(err);
  }
});

app.post(
  "/log-in",
  passport.authenticate("local", {
    successRedirect: "/files",
    failureRedirect: "/",
  })
);

app.post("/upload", upload.single("file"), async (req, res) => {
  const file = req.file;
  const user = req.user;
  if (!file) {
    return res.status(400).send("No file uploaded");
  }
  await prisma.file.create({
    data: {
      name: file.originalname,
      path: file.path, 
      uploaderId: user.id, 
    },
  });
  res.redirect("/files");
});

app.get("*", (req, res) => {
  res.status(404).send("404 Not Found");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
