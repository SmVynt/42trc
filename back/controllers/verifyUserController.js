const jwt = require('jsonwebtoken');
const Room = require('../models/Room');

const verify = async(token,roomname,username) => {

    if(!token){return false};
    if(!roomname){return false};
    if(!username){return false};

    try {
        const decoded = await jwt.verify(token,process.env.JWT_SK);
        
        if ((decoded.username!=username)||(decoded.roomname!=roomname)){
            return false;
        }
        
        const room = await Room.findOne({roomname: roomname});
        if (!room){
            return false;   
        }

        return true;
        
    } catch (error) {
        console.error('Token verification error'. error);
        return false;
    }
};

const verifyUser = async(req,res) => {
    const token = (req.headers['authorization']);
    const {roomname, username} = req.body;
    isOk = await verify(token,roomname,username);
    if(isOk){
        console.log('OK');
        return res.status(200).json({
            verified:true
        })
    }
    else{
        console.log('NOT OK');
        return res.status(200).json({
            verified:false
        })
    }
};



module.exports = {verify, verifyUser};