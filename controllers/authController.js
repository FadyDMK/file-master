const asyncHandler = require("express-async-handler");
const passport = require("../config/passportConfig");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.signUpPostController = asyncHandler(async (req, res, next) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    await prisma.user.create({
      data: {
        name: req.body.username,
        password: hashedPassword,
        email: req.body.email,
      },
    });

    res.redirect("/files");
  } catch (err) {
    return next(err);
  }
});

exports.logInPostController = passport.authenticate("local", {
  successRedirect: "/files",
  failureRedirect: "/",
});
