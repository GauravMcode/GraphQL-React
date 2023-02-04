const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.get('Authorization');
    if (!authHeader) {      //if req header doesn't contains jwt token
        req.isAuth = false;
        return next();
    }
    const token = authHeader.split(' ')[1];  //extracting token from header
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, 'somesupersecretkey');  //decode and verify token; returns decoded token
    } catch (error) {
        req.isAuth = false;
        return next();
    }
    if (!decodedToken) {  // the token didn't matched, thus decodedToken was undefined
        req.isAuth = false;
        return next();
    }
    req.userId = decodedToken.userId;  //saving token to request,that can be used by next middlewares
    req.isAuth = true;
    next();
}