const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const AWS = require('aws-sdk');
const fs = require('fs');
const app = express();

// configure the AWS SDK
AWS.config.update({
  accessKeyId: 'YOUR_ACCESS_KEY',
  secretAccessKey: 'YOUR_SECRET_KEY',
  region: 'YOUR_REGION'
});

const s3 = new AWS.S3();

// specify the file you want to check and upload
const file = '';//path

fs.readFile(file, (err, data) => {
  //if (err) throw err;

  // check the file type
  if (file.endsWith('.json')) {
    // print the json file
    console.log(JSON.parse(data));
  } else if (file.endsWith('.mp4')) {
    // upload the video to S3
    const params = {
      Bucket: 'YOUR_BUCKET_NAME',
      Key: '',//path
      Body: data
    };

    s3.upload(params, (err, data) => {
      if (err) throw err;
      console.log(`File uploaded to ${data.Location}`);
    });
  }
});

app.get('/videos', (req, res) => {
  // specify the S3 bucket you want to list the videos from
  const params = {
    Bucket: 'YOUR_BUCKET_NAME'
  };
  // list all objects in the S3 bucket
  s3.listObjects(params, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      // extract the videos from the S3 objects
      const videos = data.Contents.filter((obj) => obj.Key.endsWith('.mp4'));

      // create an array of video details
      const videoDetails = videos.map((video) => {
        return {
          key: video.Key,
          link: s3.getSignedUrl('getObject', { Bucket: 'YOUR_BUCKET_NAME', Key: video.Key, Expires: 60 }),
          size: video.Size,
          lastModified: video.LastModified
        }
      });

      // return the video details
      res.status(200).json(videoDetails);
    }
  });
});

app.use(cors());

const mediaRoutes = require("./routes/media");

app.use("/api/v1/media", mediaRoutes);
app.use("/public", express.static(path.join(__dirname, "public")));

const mongodbUri = "mongodb://localhost:27017/uploadproject";

mongoose.connect(mongodbUri, {
  useNewUrlParser: true,
});

mongoose.connection.on("connected", () => {
  console.log("Connected to mongodb...");
});

mongoose.connection.on("error", (err) => {
  console.log("Error connecting to mongo", err);
});

app.listen(4000, () => {
  console.log("App is running on PORT 4000");
});