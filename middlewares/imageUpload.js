const fs = require("fs");

module.exports.imageUpload = async function (req, res, next) {
  try {
    // console.log(Object.values( req.files).flat());
    if (!req.files || Object.values(req.files).flat().length === 0) {
      return res.status(400).json({ message: "No files selected" });
    }
    let files = Object.values(req.files).flat();
    files.forEach((file) => {
      if (
        file.mimetype !== "image/jpeg" &&
        file.mimetype !== "image/png" &&
        file.mimetype !== "image/gif" &&
        file.mimetype !== "image/svg" &&
        file.mimetype !== "image/jpg" &&
        file.mimetype !== "image/webp"
      ) {
        //to remove pic from going to tmp folder if error
        removeTemp(files.tempFilePath);
        return res.status(400).json({ message: "Unsupported format" });
      }
      //if pic size > 5 mega bites
      if (file.size > 1024 * 1024 * 5) {
        return res.status(400).json({ message: "File size is too large" });
      }
    });
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeTmp = (path) => {
  fs.unlink(path, (err) => {
    if (err) throw err;
  });
};
