const Gun = require('gun')
require('gun/sea')
const express = require('express')
const helmet = require('helmet')
const SEA = Gun.SEA
const gun = Gun()
const app = express()

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
            const pubkey = exSoul[1]
            if (pubkey && typeof(pub_val) == 'string') {
                try {
                    const obj = JSON.parse(pub_val)
                    if (obj.signed) {
                        if (pubkey.length < 87) {
                            
                        } else {
                            verify_sig(obj.signed, pubkey).then( res => {
                                console.log(res)
                                try {
                                    if (res !== undefined) {
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
            if (!pubkey && typeof(pub_val) == 'string') {
                try {
                    const obj = JSON.parse(pub_val)    
                    sea(Object.keys(put)[0]).then(res => {
                        if (res === undefined) {
                            if (pub == 'sea') {
                                if (obj.auth && obj.pub) {
                                    verify_sig(obj.auth, obj.pub).then( res_sig => { 
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
                                        if (obj.auth && exist_obj.pub) {
                                            verify_sig(obj.auth, exist_obj.pub).then( res_sig => { 
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