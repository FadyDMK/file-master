const asyncHandler = require("express-async-handler");
const passport = require("../config/passportConfig");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.signUpPostController = asyncHandler(async (req, res, next) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const newUser = await prisma.user.create({
      data: {
        name: req.body.username,
        password: hashedPassword,
        email: req.body.email,
      },
    });
    const newFolder = await prisma.folder.create({
      data: {
        name: "index" + "_" + newUser.id,
        path: "uploads/index" + "_" + newUser.id,
        owner: {
          connect: {
            id: newUser.id,
          },
        },
      },
    });
    await new Promise((resolve, reject) => {
      passport.authenticate("local", (err, user) => {
        if (err) {
          reject(err);
        }
        req.logIn(user, (err) => {
          if (err) {
            reject(err);
          }
          resolve();
        });
      })(req, res, next);
    });
    res.redirect(`/files/${newFolder.id}`);
  } catch (err) {
    next(err);
  }
});

exports.logInPostController = asyncHandler(async (req, res, next) => {
  passport.authenticate("local", async (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect("/");
    }

    req.logIn(user, async (err) => {
      if (err) {
        return next(err);
      }

      try {
        // Fetch the main folder for the logged-in user
        const folderInfo = await prisma.folder.findFirst({
          where: {
            ownerId: user.id,
            name: `index_${user.id}`, // Ensure it matches the naming convention
          },
        });

        if (!folderInfo) {
          throw new Error("Main folder not found for this user.");
        }

        // Redirect to the user's main folder
        res.redirect(`/files/${folderInfo.id}`);
      } catch (fetchError) {
        next(fetchError);
      }
    });
  })(req, res, next);
});
