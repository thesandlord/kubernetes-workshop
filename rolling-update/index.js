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
var sharp   =   require("sharp");
var fs      =   require('fs');
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
        sharp(__dirname + "/" + req.file.path).rotate(180).toFile(__dirname + "/rotated-" + req.file.filename, (err, info) => {
            fs.unlink(__dirname + "/" + req.file.path);
            if(err) {
                return res.end("Error rotating file. " + err);
            }
            setTimeout(()=>{fs.unlink(__dirname + "/rotated-" + req.file.filename);},1000);
            res.sendFile(__dirname + "/rotated-" + req.file.filename);
        });
    });
});

app.listen(3000,function(){
    console.log("Working on port 3000");
});