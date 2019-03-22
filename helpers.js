//Include the required node modules
const crypto = require('crypto')
//Get some environmental variables
const config = require('./config')

//Initialize helpers object
let helpers = {}

//Convert JSON to JS object
helpers.parseJSON = (data) => {
    try {
        let parsedObject = JSON.parse(data)
        return parsedObject
    } catch (err) {
        return {}
    }
}
//Create an authentication token
helpers.createToken = (tokenLength, phone) => {
    tokenLength = typeof(tokenLength) == "number" && tokenLength > 0 ? tokenLength : false
    if (tokenLength) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        let result = ''
        //Add a specified number random characters to make the token
        for (let i = 0; i < tokenLength; i++) {
           let random = chars.charAt(Math.floor(Math.random() * chars.length))
           result += random
        }
        //Create the token
        const token = {
            'phone': phone,
            'tokenId': result,
            'expires': Date.now() + 3600000
        }
        return token
    } else {
        return false
    }
}

//Hash password so it can safely be stored using SHA256 algorithm
helpers.hash = str => {
    if (typeof(str) == "string" && str.length >= 8) {
        const hashedStr = crypto
            .createHmac('sha256', config.hashSecret)
            .update(str)
            .digest('hex')
        return hashedStr
    } else {
        return false
    }
}
//Export the helpers module
module.exports = helpers