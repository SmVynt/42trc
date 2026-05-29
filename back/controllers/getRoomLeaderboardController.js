const Room = require('../models/Room');
const {verify} = require('../controllers/verifyUserController');

const getLeaderboard = async(req,res) => {
    
    
    /* -- INITIAL CHECK -- */
    const token = req.headers['authorization'];
    const {roomname, username} = req.body;

    const verified = await verify(token,roomname,username);

    if(!verified){
        console.log("token is wrong");
        return res.status(404).json({
            message: 'token is not correct.', 
            verified: false
        });
    }

    try {
        const room = await Room.findOne({roomname: roomname});

        if (!room){
            return res.status(404).json({
                message: 'The room is not found.',
                verified: false
            });
        }
        
        let role='player';
        const participant = room.participants.find((p) => p.username===username);
        if(participant.role){
            role = participant.role;
        }


        if(room.isInPlay == true&&room.settings.endsAt>Date.now()) {
            return res.json({ 
                message: 'Leaderboard is not available. Please wait.',
                leaderboard: [],
                isInPlay: true,
                verified: true,
                role
            });
        }else{
            const leaderboard = room.participants.sort((a,b) => b.points - a.points);
            return res.json({
                leaderboard, 
                isInPlay: false,
                verified: true,
                role
        });
        };

        // checking leaderboard
        
    } catch (error){
        res.status(500).json({message:'Failed to access leaderboard', error});
    }
};

module.exports = getLeaderboard;

