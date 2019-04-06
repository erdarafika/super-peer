const Gun = require('gun')
require('gun/sea')
const express = require('express')
const helmet = require('helmet')
const SEA = Gun.SEA
const app = express()
const axios = require('axios')

app.use(helmet())
app.use(Gun.serve)
app.use(function(req, res, next) {
    res.json({name: 'super-peer', liveNet: true, version: '0.0.1'});
})

const server = app.listen(3000)

const sea = async (alias) => {
    try {
        const result = await gun.get(alias).get('sea')
        return result
    } catch (error) {
        
    }
}

const verify_sig = async (data, pub) => {
    try {
        const result = await SEA.verify(data, pub)
        return result
    } catch (error) {
        
    }
}

Gun.on('opt', function(ctx){
    if(ctx.once){ return }
    ctx.on('in', function(data){
        const to = this.to
        const put = data.put
        const get = data.get
        if (put) {
            const pub = Object.keys(put[Object.keys(put)[0]])[1]
            const pub_val = put[Object.keys(put)[0]][pub]
            const exSoul = pub.split('~')
            const path = exSoul[0]
            const pubkey = exSoul[1]
            const spath = path.split('.')
            const topic = spath[0]
            const topics = ["sea", "public", "posts", "replies", "to"]
            const filter = topics.includes(topic)

            // const id = Object.keys(put)
            // put[id[0]]['_']['>']['id'] = put[id[0]]['_']['>'][pub]
            // put[id[0]]['id'] = 'id_'+new Date().getTime()
            // console.log(pub)
            if (pubkey && typeof(pub_val) == 'string' && filter == true) {
                try {
                    const obj = JSON.parse(pub_val)
                    if (obj) {
                        if (pubkey == 'undefined' || pubkey.length < 87) {
                            
                        } else {
                            const sig = 'SEA{"m":{"message":"'+ obj.message +'"},"s":"'+ obj.sig +'"}'
                            verify_sig(sig, pubkey).then( res => {
                                const post = res.message
                                try {
                                    const id = JSON.parse(pub_val)
                                    if (res !== undefined && post.length <= 10000 && id.hash) {
                                        // index data on couchdb
                                        obj.id = pub
                                        axios({
                                            method: 'PUT',
                                            headers: { "Content-Type": "application/json" },
                                            url: 'http://178.128.101.229:5984/media/'+obj.hash,
                                            data: obj
                                        })
                                        .then(function (response) {
                                            // console.log(response);
                                        })
                                        .catch(function (error) {
                                            // console.log(error);
                                        });
                                        to.next(data)
                                    }
                                } catch (error) {
                                    
                                }
                            })
                        }
                    }
                } catch (error) {
                    
                }
            }
            if (!pubkey && typeof(pub_val) == 'string' && filter == true) {
                try {
                    const obj = JSON.parse(pub_val)    
                    sea(Object.keys(put)[0]).then(res => {
                        if (res === undefined) {
                            if (pub == 'sea') {
                                if (obj.epub && obj.pub && obj.ct && obj.iv && obj.s) {
                                    const struct = {ct: obj.ct, iv: obj.iv, s: obj.s}
                                    const auth = 'SEA{"m":{"ct":"'+obj.ct+'","iv":"'+obj.iv+'","s":"'+obj.s+'"},"s":"'+obj.sig+'"}'
                                    verify_sig(auth, obj.pub).then( res_sig => { 
                                        if (res_sig) {
                                            to.next(data)
                                        }
                                    })
                                }
                            }
                        } else {
                            try {
                                const exist_obj = JSON.parse(res)
                                if (pub == 'sea') {
                                    if (obj.pub == exist_obj.pub) {
                                        if (obj.epub && obj.pub && obj.ct && obj.iv && obj.s && exist_obj.pub) {
                                            const struct = {ct: exist_obj.ct, iv: exist_obj.iv, s: exist_obj.s}
                                            const auth = 'SEA{"m":{"ct":"'+exist_obj.ct+'","iv":"'+exist_obj.iv+'","s":"'+exist_obj.s+'"},"s":"'+exist_obj.sig+'"}'
                                            verify_sig(auth, exist_obj.pub).then( res_sig => { 
                                                if (res_sig) {
                                                    to.next(data)
                                                }
                                            })
                                        }
                                    }    
                                } else {
                                    try {
                                        const obj = JSON.parse(pub_val)
                                        if (obj.data) {
                                            verify_sig(obj.data, exist_obj.pub).then( res_sig => { 
                                                if (res_sig) {
                                                    to.next(data)
                                                }
                                            })
                                        }
                                    } catch(error) {
                        
                                    } 
                                }
                            } catch(error) {
                
                            }
                        }
                    })
                } catch(error) {
                    
                }        
            }
        } else if (get) {
            to.next(data)
        }
        
    })
})

Gun({localStorage: false, radisk: true, web: server})
console.log('Server is running on port 3000')
