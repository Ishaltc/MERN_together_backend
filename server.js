const express = require("express");
const cors = require("cors");
const { readdirSync } = require("fs");
const colors = require("colors");
const app = express();
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const logger = require('morgan');
const helmet = require("helmet");

app.use(helmet());
app.use(logger('dev'));
app.use(cors());
dotenv.config();
app.use(express.json());
app.use(
  fileUpload({
    useTempFiles: true,
  })
);

//routes
readdirSync("./routes").map((r) => app.use("/", require("./routes/" + r)));

//database
mongoose
  .connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
  })
  .then(() => console.log("Database connection successfully".america))
  .catch((err) => console.log("error connecting to mongodb", err));

let PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`.rainbow);
});
