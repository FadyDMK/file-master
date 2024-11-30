const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();


router.get("/files", async (req, res) => {
  const userFiles = await prisma.user.findUnique({
    where: {
      id: req.user.id,
    },
    include: {
      Post: true,
    },
  });
  res.render("files", { files: userFiles.Post || [], user: req.user });
});

router.get("/download/:id", async (req, res) => {
  const file = await prisma.file.findUnique({
    where: {
      id: parseInt(req.params.id),
    },
  });
  res.download(file.path, file.name);
});

router.post("/upload", upload.single("file"), async (req, res) => {
  const file = req.file;
  const user = req.user;
  if (!file) {
    return res.status(400).send("No file uploaded");
  }
  await prisma.file.create({
    data: {
      name: file.originalname,
      path: file.path,
      uploaderId: user.id,
    },
  });
  res.redirect("/files");
});

module.exports = router;
