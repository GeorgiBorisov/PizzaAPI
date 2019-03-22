//Set some environmental variables 
const env = {
    //The port for the server to listen to
    port: 3030,
    //Secret string to hash the passwords
    hashSecret: 'askd8275hfgr3280',
    //Extend token's validity
    tokenExtend: 3600000, //One hour
    //Interval to check the orders and remove those
    //which are completed and more than a week old
    checkOrdersInterval: 3600000 * 168, // One week
    //Interval to check for invalid tokens
    checkTokensInterval: 3600000, //One hour
    //Base URL for the payment API
    stripeBaseURL: 'api.stripe.com',
    //Stripe public key
    stripePublic: 'STRIPE PUBLIC KEY',
    //Stripe secret key 
    stripeSecret: 'STRIPE SECRET KEY',
    //Stripe charge URL
    charge: '/v1/charges',
    //Base mailgun API URL
    mailgunURL: 'api.mailgun.net',
    //Mailgun message URL
    messageURL: 'MESSAGE URL',
    //Mailgun API key
    mailgunKey: 'MAILGUN KEY',
    //Mailgun sender email
    mailgunSender: 'MAILGUN SENDER E-MAIL'
}
//Export env object
module.exports = env
