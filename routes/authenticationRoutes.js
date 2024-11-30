const express = require("express");
const router = express.Router();
const { signUpPostController } = require("../controllers/authController");
const { logInPostController } = require("../controllers/authController");

router.get("/sign-up", (req, res) => res.render("sign-up-form"));
router.get("/log-in", (req, res) => res.render("log-in"));
router.get("/log-out", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  });
});

router.post("/sign-up", signUpPostController);
router.post("/log-in", logInPostController);

module.exports = router;
