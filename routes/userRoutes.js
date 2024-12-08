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
} = require("../controllers/fileController");

router.get("/files", ensureAuthenticated, filesRedirectController);
// Get all files and folders at the root level or in a specific folder
router.get("/files/:folderId", ensureAuthenticated, filesGetController);

// Create a folder
router.post("/create-folder", ensureAuthenticated, async (req, res) => {
  const user = req.user;
  const folderName = req.body.folderName;
  const parentId = req.body.folderId ? parseInt(req.body.folderId) : null;
  try {
    const newFolder = await prisma.folder.create({
      data: {
        name: folderName,
        path: `uploads/${req.body.folderName}`,
        ownerId: user.id,
        parentId: parentId,
      },
    });

    res.redirect(`/files/${newFolder.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to create folder");
  }
});

// Upload a file to a folder
router.post(
  "/upload",
  ensureAuthenticated,
  upload.single("file"),
  filesUploadController
);

// Download a file
router.get("/download/:id",filesDownloadController);

// Delete a folder and its contents
router.post("/delete-folder/:id", async (req, res) => {
  const folderId = parseInt(req.params.id);

  try {
    // Delete all files in the folder
    await prisma.file.deleteMany({
      where: { folderId },
    });

    // Recursively delete subfolders
    const deleteSubfolders = async (id) => {
      const subfolders = await prisma.folder.findMany({
        where: { parentId: id },
      });
      for (const subfolder of subfolders) {
        await deleteSubfolders(subfolder.id);
      }
      await prisma.folder.delete({ where: { id } });
    };
    await deleteSubfolders(folderId);

    // Delete the folder itself
    await prisma.folder.delete({
      where: { id: folderId },
    });

    res.redirect(`/files`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to delete folder");
  }
});

// Delete a file
router.post("/delete-file/:id", async (req, res) => {
  const fileId = parseInt(req.params.id);

  try {
    await prisma.file.delete({
      where: { id: fileId },
    });

    res.redirect("back");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to delete file");
  }
});
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}

module.exports = router;
