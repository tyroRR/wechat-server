const crypto = require('crypto');
const request = require('request-promise');
const util = require('util');
const fs = require('fs');
const accessTokenJson = require('./access_token');

class WeChat {
    constructor(config){
        this.config = config;
        this.token = config.token;
        this.appID = config.appID;
        this.appSecret = config.appSecret;
        this.encodingAESKey = config.encodingAESKey;
        this.apiDomain = config.apiDomain;
        this.apiURL = config.apiURL;
    }

    auth(req,res) {
        const signature = req.query.signature;
        const timestamp = req.query.timestamp;
        const nonce = req.query.nonce;
        const echostr = req.query.echostr;

        let array = [this.token,timestamp,nonce];
        array.sort();

        let tempStr = array.join('');
        const hashCode = crypto.createHash('sha1'); //创建加密类型
        let resultCode = hashCode.update(tempStr,'utf8').digest('hex'); //对传入的字符串进行加密

        if(resultCode === signature){
            res.send(echostr);
        }else{
            res.send('mismatch');
        }
    }

    getAccessToken() {
        let _this = this;
        return new Promise((resolve,reject)=>{
            const currentTime = new Date().getTime();
            const url = util.format(_this.apiURL.accessTokenApi,_this.apiDomain,_this.appID,_this.appSecret);
            //console.log(url);
            if(accessTokenJson.access_token === "" || accessTokenJson.expires_time < currentTime) {
                let options = {
                    method: 'GET',
                    uri: url,
                    //resolveWithFullResponse: true
                };
                request(options).then(data =>{
                    let result  = JSON.parse(data);
                    //console.log(result);
                    if(data.indexOf("errcode") < 0){
                        accessTokenJson.access_token = result.access_token;
                        accessTokenJson.expires_time = new Date().getTime() + (parseInt(result.expires_in) - 200) * 1000;
                        //更新本地存储的
                        fs.writeFile('./access_token.json',JSON.stringify(accessTokenJson));
                        //将获取后的 access_token 返回
                        resolve(accessTokenJson.access_token);
                    }else{
                        //将错误返回
                        resolve(result);
                    }
                }).catch(err => {
                    console.log(err);
                })
            }
            else{
                //将本地存储的 access_token 返回
                resolve(accessTokenJson.access_token);
            }
        })
    }

    sendMsg(req,res) {
        let _this = this;
        this.getAccessToken().then(function(data){
            //格式化请求连接
            const url = util.format(_this.apiURL.sendMsgApi,_this.apiDomain,accessTokenJson.access_token);
            //使用 Post 请求
            const fromUserName = req.body.FromUserName;
            const options = {
                method: 'POST',
                uri: url,
                body: {
                    "touser":fromUserName,
                    "msgtype":"text",
                    "text":
                        {
                            "content":"http://www.zmpay.top/xpay/qrcode/G2018012610241920349?uid=1111123213"
                        }
                },
                json: true // Automatically stringifies the body to JSON
            };
            request(options).then(data => {
                console.log(data)
            }).catch(err => {
                console.log(err)
            });
        }).catch(err=>console.log(err));
    }
}

module.exports = WeChat;