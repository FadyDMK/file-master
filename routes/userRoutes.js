const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const {
  filesRedirectController,
  filesGetController,
  filesUploadController,
  filesDownloadController,
  filesDeleteController,
} = require("../controllers/fileController");
const {
  folderCreateController,
  folderDeleteController,
} = require("../controllers/folderController");

router.get("/files", ensureAuthenticated, filesRedirectController);
// Get all files and folders at the root level or in a specific folder
router.get("/files/:folderId", ensureAuthenticated, filesGetController);

// Create a folder
router.post("/create-folder", ensureAuthenticated, folderCreateController);

// Upload a file to a folder
router.post(
  "/upload",
  ensureAuthenticated,
  upload.single("file"),
  filesUploadController
);

// Download a file
router.get("/download/:id", filesDownloadController);

// Delete a folder and its contents
router.post("/delete-folder/:id", folderDeleteController);

// Delete a file
router.post("/delete-file/:id", filesDeleteController);
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/files");
}

module.exports = router;
