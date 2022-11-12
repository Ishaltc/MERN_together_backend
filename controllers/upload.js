const cloudinary = require("cloudinary");
const fs = require("fs");
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});
exports.uploadImages = async (req, res) => {
  try {
   
    const { path } = req.body;
    const files = Object.values(req.files).flat();
    let images = [];
    // going through all the files we have
    for (const file of files) {
      const url = await uploadToCloudinary(file, path);
      images.push(url);
      // after removing from tmp folder
      removeTmp(file.tempFilePath);
    }
    res.json(images);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//taking images from cloudinary
exports.listImages = async (req, res) => {
  const { path, sort, max } = req.body;

  cloudinary.v2.search
    .expression(`${path}`)
    .sort_by("created_at",`${sort}`)
    .max_results(max)
    .execute()
    .then((result) => {
      res.json(result);
    })
    .catch((err) => {
      console.log(err.error.message);
    });
};
//////////
const uploadToCloudinary = async (file, path) => {
  try {
    return new Promise((resolve) => {
      cloudinary.v2.uploader.upload(
        // uploading file from tmp folder
        file.tempFilePath,
        {
          folder: path,
        },
        (err, res) => {
          if (err) {
            //removing image from tmp folder
            removeTmp(file.tempFilePath);
            return res
              .status(400)
              .json({ message: "Upload image failed" });
          }
          resolve({
            //secure_url is image url which we upload into cloud storage.we pushing this url to image [] above
            url: res.secure_url,
          });
        }
      );
    });
  
  
  } catch (error) {
    console.log(error.error.message);
  }
}
 
const removeTmp = (path) => {
  fs.unlink(path, (err) => {
    if (err) throw err;
  });
};
