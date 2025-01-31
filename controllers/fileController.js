const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const asyncHandler = require("express-async-handler");
const path = require("path");

// Redirect to the main folder
exports.filesRedirectController = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const mainFolder = await prisma.folder.findFirst({
      where: {
        ownerId: user.id,
        parentId: null,
        name: "index" + "_" + user.id,
      },
      include: {
        files: true,
        subfolders: true,
      },
    });
    if (!mainFolder) {
      return res.status(404).json({ message: "Main folder not found" });
    }

    res.status(200).json({
      folderId: mainFolder.id,
      files: mainFolder.files,
      subfolders: mainFolder.subfolders,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to retrieve files or folders");
  }
});

// Get all files and folders at the root level or in a specific folder
exports.filesGetController = asyncHandler(async (req, res) => {
  const folderId = req.params.folderId ? parseInt(req.params.folderId) : null;
  const user = req.user;

  if (!user) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const folders = await prisma.folder.findMany({
      where: {
        parentId: folderId,
        ownerId: user.id,
      },
    });
    const files = await prisma.file.findMany({
      where: {
        folderId: folderId,
        uploaderId: user.id,
      },
    });

    res.status(200).json({
      folders,
      subfolders: folders.subfolders,
      files: files,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to retrieve files or folders");
  }
});
// Upload a file to a folder
exports.filesUploadController = asyncHandler(async (req, res) => {
  const file = req.file;
  const user = req.user;
  const folderId = req.body.folderId ? parseInt(req.body.folderId) : null;

  if (!file) {
    return res.status(400).send("No file uploaded");
  }

  try {
    await prisma.file.create({
      data: {
        name: file.originalname,
        path: file.path,
        uploaderId: user.id,
        folderId: folderId,
      },
    });

    res.redirect(`/files/${req.body.folderId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to upload file");
  }
});
// Download a file
exports.filesDownloadController = asyncHandler(async (req, res) => {
  try {
    const file = await prisma.file.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
    });

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    const filePath = path.join(__dirname, '..', file.path);
    res.setHeader('content-disposition', `attachment; filename="${file.name}"`);
    res.sendFile(filePath);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to retrieve file" });
  }
});

// Delete a file
exports.filesDeleteController = asyncHandler(async (req, res) => {
  const fileId = parseInt(req.params.id);

  try {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    await prisma.file.delete({
      where: { id: fileId },
    });
    res.redirect(`/files/${file.folderId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to delete file");
  }
});
