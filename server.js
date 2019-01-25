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
    res.json({name: 'super-peer', version: '0.0.1'});
})

const server = app.listen(3000)

const sea = async (alias) => {
    const result = gun.get(alias).get('sea')
    return result
}

const verify_sig = async (data, pub) => {
    const result = await SEA.verify(data, pub)
    return result
}

Gun.on('opt', function(ctx){
    if(ctx.once){ return }
    ctx.on('in', function(data){
        const to = this.to
        const put = data.put
        const get = data.get
        // console.log(get)
        // console.log(put)
        if (put) {
            const obj_key = Object.keys(put)[0]
            const obj_val = put[obj_key]
            const pub = Object.keys(obj_val)[1]
            const pub_val = obj_val[pub]
            // console.log(obj_key)
            if (typeof(pub_val) == 'string') {
                try {
                    const obj = JSON.parse(pub_val)    
                    sea(obj_key).then(res => {
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
                                        verify_sig(exist_obj.auth, exist_obj.pub).then( res_sig => { 
                                            if (res_sig) {
                                                to.next(data)
                                            }
                                        })
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