const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const asyncHandler = require("express-async-handler");

exports.folderCreateController = asyncHandler(async (req, res) => {
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
