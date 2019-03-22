//Include the required node modules
const crud = require('./data')
const helpers = require('./helpers')
const validator = require('./validator')
const config = require('./config')
const api = require('./apis')
//Valid requests types
const reqTypes = ['get', 'post', 'put', 'delete']
//Initialize router
let router = {}
//Initialize user object
router.user = {}
//Handle requests to /users toute
router.users = (data, callback) => {
    if (reqTypes.indexOf(data.method) != -1) {
        router.user[data.method](data, callback)
    } else {
        callback(404)
    }
}
//Create new user
router.user.post = (data, callback) => { 
    //Request object is created and will be passed to the validator to check and format (if needed) the information
    let input = {
        firstName: data.reqBody.firstName,
        lastName: data.reqBody.lastName,
        phone: data.reqBody.phone,
        password: data.reqBody.password,
        address: data.reqBody.address,
        email: data.reqBody.email
    }
    //Validate the request
    validator.validateRequest(input, data.method, (reqValid, reqData) => {
        if (reqValid) {
            //Check if the user exists
            crud.read('users', reqData.phone, (err, userData /* It shoudn't return any user data */) => {
                //If there is no such user, error will be returned, so the user will be created
                if (err) {
                    //Check if the email format is correct
                    const validEmail = validator.validateEmail(reqData.email)
                    if (validEmail) {
                        //Hash the password
                        const hashedPass = helpers.hash(reqData.password)
                        if (hashedPass) {
                            //Create the user object
                            const newUser = {
                                'firstName': reqData.firstName,
                                'lastName': reqData.lastName,
                                'phone': reqData.phone,
                                'hashedPass': hashedPass,
                                'address': reqData.address,
                                'validEmail':validEmail
                            }
                            //Create the new user
                            crud.create('users', reqData.phone, newUser, err => {
                                if (!err) {
                                    callback(200)
                                } else {
                                    callback(500, {'Error': 'Could not create the user'})
                                }
                            })
                        } else {
                            callback(500, {'Error': 'Could not hash the password'})
                        }
                    } else {
                        callback(400, {'Error': 'The provided email is not valid'})
                    }
                    //The user exists, so it could and shoud not be created
                } else {
                    callback(400, {'Error': 'A user with that phone already exists'})
                }
            })
        } else {
            callback(400, {'Error': 'Missing required fields'})
        }
    })
}
//Retrieve the information about a user. Phone and authentication token are required
router.user.get = (data, callback) => {
    let input = {
        phone: data.query.phone,
        token: data.headers.token
    }
    validator.validateRequest(input, data.method, (reqValid, reqData) => {
        if (reqValid) {
            //Check the token's validity
            validator.validateToken(reqData.phone, reqData.token, (tokenIsValid) => {
                if (tokenIsValid) {
                    //Get the user data
                    crud.read('users', reqData.phone, (err, userObj) => {
                        if (!err && userObj) {
                            //Remove the password from the object which is to be returned as response
                            delete userObj.hashedPass
                            callback(false, userObj)
                        } else {
                            callback(500, {'Error': 'User information could not be retrieved'})
                        }
                    }) 
                } else {
                    callback(403, {'Error': 'the provided token is not valid'})
                }
            })
        } else {
            callback(400, {'Error':'Missing required fields'})
        }
    })
}
//Update the profile of an existing user. Phone and token are required, all other data is optional
router.user.put = (data, callback) => {
    let input = {
        firstName: data.reqBody.firstName,
        lastName: data.reqBody.lastName,
        phone: data.reqBody.phone,
        password: data.reqBody.password,
        address: data.reqBody.address,
        email: data.reqBody.email,
        token: data.headers.token
    }
    validator.validateRequest(input, data.method, (reqValid, reqData) => {
        if (reqValid) {
            validator.validateToken(reqData.phone, reqData.token, tokenIsValid => {
                if (tokenIsValid) {
                    //Hash the provided password
                    const providedPassHash = helpers.hash(reqData.password)
                    crud.read('users', reqData.phone, (err, userData) => {
                         //Check if the provided password matches
                        //Check which of the optional fields is provided and update it accordingly
                        if (!err && userData && providedPassHash === userData.hashedPass) {
                            if(input.firstName){
                                userData.firstName = reqData.firstName
                            }
                            if(input.lastName){
                                userData.lastName = reqData.lastName
                            }
                            if(input.address){
                                userData.address = reqData.address
                            }
                            if(input.email){
                                userData.email = reqData.email
                            }
                            if(input.password){
                                userData.hashedPass = providedPassHash
                            }
                            //Update the user with the new information
                            crud.update('users', reqData.phone, userData, err => {
                                if (!err) {
                                    callback(200)
                                } else {
                                    callback(500, {'Error': 'Could not update the user'})
                                }
                            })
                        } else {
                            callback(400, {'Error': 'User coud not be found'})
                        }
                    })
                } else {
                    callback(403, {'Error': 'Invalid token'})
                }
            })
        } else {
            callback(400, {'Error':'Missing required fields'})
        }
    })
}
//Delete user profile
//Required data: token, phone, password
router.user.delete = (data, callback) => {
    let input = {
        token: data.headers.token,
        phone: data.reqBody.phone,
        password: data.reqBody.password,
    }
    validator.validateRequest(input, data.method, (reqValid, reqData) => {
        if (reqValid) {
            crud.delete('orders', reqData.phone, err => {
                if (!err) {
                    crud.delete('users', reqData.phone, err => {
                        if (!err) {
                            callback(200, {'Message':'The user\'s profile was deleted. All orders which were not completed are still considered valid'})
                        } else {
                            callback(500, {'Error': 'Could not delete the user\'s profile'})
                        }
                    })
                } else {
                    callback(500, {'Error': 'Could not delete user\'s orders'})
                }
            })
        } else {
            callback(400, {'Error': 'Missing required fields'})
        }
    })
}
//Handle request to /tokens
router.tokens = (data, callback) => {
    if (reqTypes.indexOf(data.method) != -1) {
        router.token[data.method](data, callback)
    } else {
        callback(404)
    }
}
//Initialize token object
router.token = {}
//Create a new token
//Required data: phone, password
router.token.post = (data, callback) => {
    let input = {
        phone: data.reqBody.phone,
        password: data.reqBody.password,
    }
    validator.validateRequest(input, data.method, (reqValid, reqData) => {
        if (reqValid) {
            crud.read('users', reqData.phone, (err, userData) => {
                if (!err && userData) {
                const providedPassHash = helpers.hash(reqData.password)
                    if (providedPassHash === userData.hashedPass) {
                        const token = helpers.createToken(20, reqData.phone)
                        crud.create('tokens', token.tokenId, token, err => {
                            if (!err) {
                                callback(201, token)
                            } else {
                                callback(500, {'Error': 'Could not create the token'})
                            }
                        })
                    } else {
                        callback(400, {'Error': 'The provided password does not match'})
                    }
                } else {
                    callback(400, {'Error': 'The specified user could not be found'})
                }
            })
        } else {
            callback(400, {'Error': 'Missing required fields'})
        }  
    })           
}
//Get token data
//Required data: token
router.token.get = (data, callback) => {
    let input = {
        token: data.query.id
    }
    validator.validateRequest(input, data.method, (reqValid, reqData) => {
        if (reqValid) {
            crud.read('tokens', reqData.token, (err, tokenData) => {
                if (!err && tokenData) {
                    callback(200, tokenData)
                } else {
                    callback(404, {'Error': 'The token could not be found'})
                }
            }) 
        } else {
            callback(400, {'Error': 'Token ID is missing'})
        }
    })
}
//Extend the token's validity for 1 hour
//Required data: token, extend parameter set to TRUE
router.token.put = (data, callback) => {
    let input = {
        token: data.reqBody.id,
        extend: data.reqBody.extend
    }
    validator.validateRequest(input, data.method, (reqValid, reqData) => {
        if (reqValid) {
            crud.read('tokens', reqData.token, (err, tokenData) => {
                if (!err && tokenData.expires > Date.now()) {
                    tokenData.expires = Date.now() + config.tokenExtend
                    crud.update('tokens', tokenData.tokenId, tokenData, err => {
                        if (!err) {
                            callback(200)
                        } else {
                            callback(500, {'Error': 'Token could not be updated'})
                        }
                    })
                } else if (tokenData.expires < Date.now()) {
                    callback(403, {'Error': 'The token has expired please get a new token'})
                } else {
                    callback(500, {'Error': 'Token could not be retrieved'})
                }
            })
        } else {
            callback(400, {'Error': 'Required fields are missing'})
        }
    })
}
//Delete token
//Required data: token
router.token.delete = (data, callback) => {
    let input = {
        token: data.reqBody.id
    }
    validator.validateRequest(input, data.method, (reqValid, reqData) => {
        if (reqValid) {
            //Get the requested token
            crud.read('tokens', reqData.token, (err, tokenData) => {
                if (!err && tokenData) {
                    //Delete the token
                    crud.delete('tokens', tokenData.tokenId, err => {
                        if (!err) {
                            callback(false)
                        } else {
                            callback('Could not delete token')
                        }
                    })
                } else {
                    callback(404, {'Error':'Token does not exist'})
                }
            })
        } else {
            callback(403, {'Error': 'No token ID was provided'})
        }
    })       
}
//Handle request to /products
router.products = (data, callback) => {
    if (reqTypes.indexOf(data.method) != -1) {
        router.product[data.method](data, callback)
    } else {
        callback(404)
    }
}
//Initialize the product object
router.product = {}
//List all products from the menu
router.product.get = (data, callback) => {
    let input = {
        token: data.headers.token,
        phone: data.query.phone
    }
    validator.validateRequest(input, data.method, (reqValid, reqData) => {
        if (reqValid) {
            validator.validateToken(reqData.phone, reqData.token, tokenIsValid => {
                if (tokenIsValid) {
                    crud.read('menu', 'menu', (err, menu) => {
                        if (!err && menu) {
                            callback(200, menu)
                        } else {
                            callback(500, {'Error': 'Could not retrieve the menu'})
                        }
                    })
                } else {
                    callback(403, {'Error': 'Invalid token ID'})
                }
            })
        } else {
            callback(400, {'Error': 'Missing required fileds'})
        }
    })
}

//Handle possible invalid requests to /products
router.product.post = 
router.product.put =
router.product.delete = (data, callback) => {
    callback(405, {'Error': 'Not allowed'})
}
//Handle request to /orders
router.orders = (data, callback) => {
    if (reqTypes.indexOf(data.method) != -1) {
        router.order[data.method](data, callback)
    } else {
        callback(404)
    }
}
//Initialize the order object
router.order = {}
//Create new order
//Required data phone, token, order items
router.order.post = (data, callback) => {
    let input = {
        phone: data.reqBody.phone,
        token: data.headers.token,
        orderItems: data.reqBody.orderItems
    }
    validator.validateRequest(input, data.method, (reqValid, reqData) => {
        if (reqValid) {
            validator.validateToken(reqData.phone, reqData.token, (tokenIsValid) => {
                if (tokenIsValid) {
                    let orderId = Date.now()
                    const currentOrder = {}
                    currentOrder[orderId] = reqData.orderItems
                    validator.calculateOrder(reqData.orderItems, (err, price) => {
                        if (!err && price) {
                            crud.read('orders', reqData.phone, (err, orderData) => {
                                if (err) {
                                    currentOrder[orderId].price = price
                                    currentOrder[orderId].completed = false
                                    crud.create('orders', reqData.phone, currentOrder, err => {
                                        if (!err) {
                                            api.payment(reqData.phone, orderId, reqData.orderItems, response => {
                                                callback(response)       
                                            })
                                        } else {
                                            callback(500, {'Error': 'Could not create an order'})
                                        }
                                    })
                                } else {
                                    orderData[orderId] = reqData.orderItems
                                    orderData[orderId].price = price
                                    orderData[orderId].completed = false
                                    crud.update('orders', reqData.phone, orderData, err => {
                                        if (!err) {
                                            api.payment(reqData.phone, orderId, reqData.orderItems, response => {
                                                callback(response)       
                                            })
                                        } else {
                                            callback(500, {'Error': 'Could not create an order'})
                                        }
                                    })
                                }
                            })
                        } else {
                            callback(err)
                        }
                    })
                } 
                else {
                    callback(403, {'Error': 'Invalid token'})
                }
            })
        } else {
            callback(400, {'Error': 'Empty order or missing authentication information'})
        }
    })
}
//Get an order by order ID
//Required data: token, phone, order ID
router.order.get = (data, callback) => {
    let input = {
        token: data.headers.token,
        phone: data.query.phone,
        orderId: data.query.orderId
    }
    validator.validateRequest(input, data.method, (reqValid, reqData) => {
        if (reqValid) {
            validator.validateToken(reqData.phone, reqData.token, tokenIsValid => {
                if (tokenIsValid) {
                    //Get the requested order
                    crud.read('orders', reqData.phone, (err, orders) => {
                        if (!err && orders.hasOwnProperty(reqData.orderId)) {
                            callback(200, orders[reqData.orderId])
                        } else {
                            callback(400, {'Error': 'The requested order does not exist'})
                        }
                    })
                } else {
                    callback(403, {'Error': 'Invalid token'})
                }
            })
        } else {
            callback(400, {'Error': 'Missing required information'})
        }
    })
}
//Handle possible attempt for a put request
router.order.put = 
router.order.delete = (data, callback) => {
    callback(405, {'Error': 'Not allowed'})
}
//Order completion is confirmed (only via PUT request)
router.confirmOrder = (data, callback) => {
    if (data.method == 'put') {
        let input = {
            token: data.headers.token,
            phone: data.reqBody.phone,
            orderId: data.reqBody.orderId
        }
        validator.validateRequest(input, data.method, (reqValid, reqData) => {
            if (reqValid) {
                validator.validateToken(input.phone, input.token, tokenIsValid => {
                    if (tokenIsValid) {
                        crud.read('orders', reqData.phone, (err, orderData) => {
                            if (!err && orderData) {
                                orderData[reqData.orderId].completed = true
                                crud.update('orders', reqData.phone, orderData, err => {
                                    if (!err) {
                                        callback(200, {'Message': `Order ${reqData.orderId} is completed`})
                                    } else {
                                        callback(500, {'Error': 'Could not mark the order as completed'})
                                    }
                                })
                            } else {
                                callback(500, {'Error':`Could not delete order ${reqData.orderId}`})
                            }
                        })
                    } else {
                        callback(403, {'Error': 'Invalid token'})
                    }
                })
            } else {
                callback(400, {'Error': 'Missing required information'})
            }
        })
    } else {
        callback(405, {'Error': 'Not allowed'})
    }
}
//Handle invalid requests to any URLs
router.notFound = (data, callback) => {
    callback(404, {'Error':'Page not found'})
}
//Export the router module
module.exports = router