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
        ownerId: user.id,
        parentId: parentId,
      },
    });

    res.redirect(`/files/${parentId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to create folder");
  }
});

exports.folderDeleteController = asyncHandler(async (req, res) => {
  const folderId = parseInt(req.params.id);

  try {
    // Recursively delete subfolders and their files
    const deleteSubfolders = async (id) => {
      const subfolders = await prisma.folder.findMany({
        where: { parentId: id },
      });
      for (const subfolder of subfolders) {
        await deleteSubfolders(subfolder.id);
      }
      await prisma.file.deleteMany({
        where: { folderId: id },
      });
      await prisma.folder.delete({ where: { id: id } });
    };
    await deleteSubfolders(folderId);
    res.redirect(`/files`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to delete folder");
  }
});
