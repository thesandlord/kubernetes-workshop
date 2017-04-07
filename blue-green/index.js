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
var express =   require("express");
var multer  =   require('multer');
var app     =   express();
var request =   require("request");
var fs      =   require('fs');

var port = process.env.port || 8080;

var storage =   multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './');
  },
  filename: function (req, file, callback) {
    callback(null, Date.now() + '-' + file.originalname);
  }
});

var upload = multer({ storage : storage}).single('userPhoto');

app.get('/',function(req,res){
      res.sendFile(__dirname + "/index.html");
});

app.post('/api/photo',function(req,res){
    upload(req,res,function(err) {
        if(err) {
            return res.end("Error uploading file.");
        }
        const formData = {
            userPhoto: fs.createReadStream(__dirname + "/" + req.file.path)
        }
        request.post({url:'http://annotate', formData: formData}, (err, httpResponse, body) => {
            if (err) {
                console.error('upload failed:', err);
                res.sendStatus(500)
                res.end("Error:", err)
                return
            }
            res.end(JSON.stringify(body))
        });
    });
});

app.listen(port, _ => {
    console.log(`Working on port ${port}`);
});