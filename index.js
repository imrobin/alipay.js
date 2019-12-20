const fs = require("fs");
const path = require("path");
const crypto = require('crypto');
const url = require('url');
class AlipayRequest
{
    constructor()
    {
        this.init();
    }

    init()
    {
        this._gateWayUrl = '';
        this._rsaPrivateKey = '';
        this._alipayrsaPublicKey = '';
        this.initParam();
    }

    initParam()
    {
        this.param = {};
    }

    set gateWayUrl(gateWayUrl)
    {
        this._gateWayUrl = gateWayUrl;
    }

    get gateWayUrl()
    {
        return this._gateWayUrl;
    }

    set rsaPrivateKey(privateKey)
    {
        this._rsaPrivateKey = "-----BEGIN PRIVATE KEY-----\n"+privateKey+"\n-----END PRIVATE KEY-----\n";
    }

    get rsaPrivateKey()
    {
        return this._rsaPrivateKey;
    }

    set alipayrsaPublicKey(publicKey)
    {
        this._alipayrsaPublicKey = "-----BEGIN PUBLIC KEY-----\n"+publicKey+"\n-----END PUBLIC KEY-----\n";
    }

    get alipayrsaPublicKey()
    {
        return this._alipayrsaPublicKey;
    }

    setParam(name,value)
    {
        this.param[name] = value;
    }

    getParam()
    {
        return this.param;
    }

    paramSort()
    {
        let newParam = {};
        let keyList = [];
        for(let index in this.param)
        {
            keyList.push(index);
        }
        keyList = keyList.sort();
        for(let index in keyList)
        {
            newParam[keyList[index]] = this.param[keyList[index]];
        }
        this.param = newParam;
    }

    paramQuery()
    {
        let i = 0;
        let signBefore = '';
        if (this.param.hasOwnProperty('sign'))
        {
            delete this.param['sign'];
        }
        this.paramSort();
        for(let index in this.param)
        {
            if(i==0)
            {
                signBefore+=index+'='+this.param[index];
            } else {
                signBefore+='&'+index+'='+this.param[index];
            }
            i++;
        }
        return signBefore;
    }

    getSign()
    {
        var sign;
        let signBefore = this.paramQuery();
        if (!this.param.hasOwnProperty('sign_type'))
        {
            throw new Error('Param not has property:sign_type');
        }
        switch (this.param['sign_type'])
        {
            case 'RSA':
                console.log("crypto ",crypto);
                sign = crypto.createSign('RSA-SHA1');
                break;
            case 'RSA2':
                console.log("crypto1 ",crypto);
                sign = crypto.createSign('RSA-SHA256');
                break;
        }
        console.log(sign);
        sign.update(signBefore, 'utf8');
        console.log(this._rsaPrivateKey);
        let res = sign.sign(this._rsaPrivateKey,'base64');
        return res;
    }
    
    
    getPemStr(pemPath)
    {
        let pemStr = fs.readFileSync(pemPath).toString();
        // pemStr = pemStr.replace(/--.*?-----/g, "");
        // pemStr = pemStr.replace(/\s/g, "");
        return pemStr;
    }

    getNowFormatDate(incrTime=0) {
        var date = new Date();
        date.setTime(date.getTime()+incrTime);
        var seperator1 = "-";
        var seperator2 = ":";
        var month = date.getMonth() + 1;
        var strDate = date.getDate();
        var currentdate = date.getFullYear() + seperator1 + this.timeAddZero(month) + seperator1 + this.timeAddZero(strDate)
                + " " + this.timeAddZero(date.getHours()) + seperator2 + this.timeAddZero(date.getMinutes())
                + seperator2 + this.timeAddZero(date.getSeconds());
        return currentdate;
    }

    timeAddZero(sz)
    {
        if (sz >= 0 && sz <= 9) {
            sz = "0" + sz;
        }
        return sz;
    }

    getYmdFormatDate(incrTime=0) {
        var date = new Date();
        date.setTime(date.getTime()+incrTime);
        var seperator1 = "-";
        var month = date.getMonth() + 1;
        var strDate = date.getDate();
        var currentdate = date.getFullYear() + seperator1 + this.timeAddZero(month) + seperator1 + this.timeAddZero(strDate);
        return currentdate;
    }

    jsonToQueryString(json) {
    return '?' + 
        Object.keys(json).map(function(key) {
            return encodeURIComponent(key) + '=' +
                encodeURIComponent(json[key]);
        }).join('&');
    }

    getRes()
    {
        var _this = this;
        return new Promise((resolve,reject)=>{
        	_this.request('get', _this.param, resolve, reject);
        });
    }
    
    request(method, data, resolve, reject) {
        var t = this;
        var u = url.parse(this._gateWayUrl)
        // 根据协议引入支持的模块
        var protocol = u.protocol;
        var index = protocol.indexOf(':');
        protocol = protocol.substr(0,index);
        var https = require(protocol);
        var req_path = u.path + this.jsonToQueryString(data);

        // 构造http(s)请求的参数
        var options = {
            hostname: u.host,
            port: protocol == 'https' ? 443: 80,
            method: method,
            path: req_path
        };

        var req = https.request(options, function(res) {
            console.log("statusCode: ", res.statusCode);
            console.log("headers: ", res.headers);

            res.on('data', function(d) {
                console.log("返回结果index ",JSON.parse(d));
                resolve(JSON.parse(d));
            });
        });
        req.on('error', function(e) {
            console.error(e);
            reject(e);
        });
        req.end();
    }
}

module.exports = AlipayRequest;
