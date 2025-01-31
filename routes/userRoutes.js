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
  folderInfoController,
} = require("../controllers/folderController");
const authenticateToken = require("../middleware/authenticateToken");

router.get("/",authenticateToken, filesRedirectController);
// Get all files and folders at the root level or in a specific folder
router.get("/:folderId",authenticateToken, filesGetController);
//get folder info
router.get("/folders/:folderId",authenticateToken, folderInfoController);


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

// Ensure that a user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/files");
}

module.exports = router;
