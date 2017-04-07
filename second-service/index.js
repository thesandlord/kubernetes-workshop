/**
* Copyright 2017, Google, Inc.
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
**/

'use strict'

const express = require('express')
const app = express()
const vision = require('@google-cloud/vision')()
const fs = require('fs')
const multer = require('multer')

const storage =   multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './')
  },
  filename: function (req, file, callback) {
    callback(null, Date.now() + '-' + file.originalname);
  }
})

const port = process.env.port || 8080

const upload = multer({ storage : storage}).single('userPhoto')

app.post('/', (req, res) => {
  upload(req,res, (err) => {
    if(err) {
      return res.end("Error uploading file.", err)
    }
    vision.detect(__dirname + "/" + req.file.path, ['labels'], (err, detections, apiResponse) => {
      fs.unlink(__dirname + "/" + req.file.path)
      res.end(JSON.stringify(detections))
    })
  })
})

app.listen(port, _ => {
    console.log(`Working on port ${port}`)
});

