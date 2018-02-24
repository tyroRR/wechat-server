const express = require('express');
const wechat = require('./wechat');
const config = require('./config');
const bodyParser = require('body-parser');

const app = express();

// create application/json parser
const jsonParser = bodyParser.json();
// create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });

const wechatApp = new wechat(config);

app.get('/',(req,res)=>{
    wechatApp.auth(req,res);
});

app.post('/',jsonParser,(req,res)=>{
    if (!req.body) {
        return res.sendStatus(400)
    }
    else {
        wechatApp.sendMsg(req,res);
    }
});

app.listen(3000);