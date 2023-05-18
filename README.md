# assignment_otp_based_login
in index.js I have created folloing in same order : 
- created a connection to mongo DB
- defined user schema having feilds : email, otp, otpExpiration, loginAttempts, blockedUntil
- create an api with path : /generate-otp, it checks if user exists, if user id blocked for time being, is OTP vaid? & if all above conditions are met then OTP is generated
- create an api with path : /login, it checks if user exists, if user id blocked for time being, is OTP vaid? & if all above conditions are met it return auth token

# tech stack
mongoose, mongoDB, jwt, express, postman
