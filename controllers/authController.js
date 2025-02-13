// const asyncHandler = require("express-async-handler");
// const passport = require("../config/passportConfig");
// const bcrypt = require("bcrypt");
// const { PrismaClient } = require("@prisma/client");
// const prisma = new PrismaClient();

// exports.signUpPostController = asyncHandler(async (req, res, next) => {
//   try {
//     const hashedPassword = await bcrypt.hash(req.body.password, 10);
//     const newUser = await prisma.user.create({
//       data: {
//         name: req.body.username,
//         password: hashedPassword,
//         email: req.body.email,
//       },
//     });
//     const newFolder = await prisma.folder.create({
//       data: {
//         name: "index" + "_" + newUser.id,
//         path: "uploads/index" + "_" + newUser.id,
//         owner: {
//           connect: {
//             id: newUser.id,
//           },
//         },
//       },
//     });
//     await new Promise((resolve, reject) => {
//       passport.authenticate("local", (err, user) => {
//         if (err) {
//           reject(err);
//         }
//         req.logIn(user, (err) => {
//           if (err) {
//             reject(err);
//           }
//           resolve();
//         });
//       })(req, res, next);
//     });
//     res.redirect(`/files/${newFolder.id}`);
//   } catch (err) {
//     next(err);
//   }
// });

// exports.logInPostController = asyncHandler(async (req, res, next) => {
//   passport.authenticate("local", async (err, user, info) => {
//     if (err) {
//       return next(err);
//     }
//     if (!user) {
//       return res.redirect("/");
//     }

//     req.logIn(user, async (err) => {
//       if (err) {
//         return next(err);
//       }

//       try {
//         // Fetch the main folder for the logged-in user
//         const folderInfo = await prisma.folder.findFirst({
//           where: {
//             ownerId: user.id,
//             name: `index_${user.id}`, // Ensure it matches the naming convention
//           },
//         });

//         if (!folderInfo) {
//           throw new Error("Main folder not found for this user.");
//         }

//         // Redirect to the user's main folder
//         res.redirect(`/files/${folderInfo.id}`);
//       } catch (fetchError) {
//         next(fetchError);
//       }
//     });
//   })(req, res, next);
// });


const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken"); // Add JWT for token-based authentication
const prisma = new PrismaClient();
const passport = require("../config/passportConfig");
require("dotenv").config();

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

    // Create a default folder for the user
    const newFolder = await prisma.folder.create({
      data: {
        name: `index_${newUser.id}`,
        path: `uploads/index_${newUser.id}`,
        owner: {
          connect: {
            id: newUser.id,
          },
        },
      },
    });

    // Create a JWT token for the new user
    const token = jwt.sign(
      { userId: newUser.id, username: newUser.name },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    res.status(201).json({
      message: "User created successfully",
      token,
      folderId: newFolder.id,  // Include the folder ID in the response
    });
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
      return res.status(401).json({ error: "Invalid credentials" });
    }

    try {
      // Create a JWT token for the authenticated user
      const token = jwt.sign(
        { userId: user.id, username: user.name },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '1h' } // Token expires in 1 hour
      );

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

      // Respond with the token and folder info
      res.status(200).json({
        message: "Login successful",
        token,
        folderId: folderInfo.id,
      });
    } catch (fetchError) {
      next(fetchError);
    }
  })(req, res, next);
});

