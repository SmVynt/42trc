const jwt = require('jsonwebtoken');
const Room = require('../models/Room');
const {getTasks} = require('../utils/getTasks');

const generateNewName = (initName, newCount) => {
    console.log (`${initName}${newCount}`);
    return `${initName}${newCount}`;
}

const joinRoom = async (req,res) => {
    const {roomname, username} = req.body;

    if (!username) {
        console.log('User name is empty');
        return res.status(400).json({message: 'User name is not found.'});
    }

    if (!roomname) {
        console.log('Room name is empty');
        return res.status(400).json({message: 'Room name is not found'});
    }

    try {
        //finding room
        const room = await Room.findOne({roomname: roomname});
        if (!room){
            console.log('Room with this name is not found');
            return res.status(404).json({message: 'The room is not found.'});

        }

        if (room.isInPlay==false){
            return res.status(403).json({message: 'The room is already closed.'});
        }



        //checking for name copies
        let existingParticipants = room.participants.find(participant => participant.username === username);
        let newUsername = username;
        let count = 1;

        while((existingParticipants!=undefined)&&(count<64)) {
            newUsername = generateNewName(username, count);
            existingParticipants = room.participants.find(participant => participant.username === newUsername);
            console.log(existingParticipants);
            count++
        }


        // Generating token
        const token = jwt.sign(
            {username:newUsername, roomname:roomname},
            process.env.JWT_SK,
            {expiresIn: '24h'}
        );

        const selectedTasks = getTasks({tasks:room.tasks,count:room.settings.maxTasksPerUser});

        console.log(selectedTasks);

        // Adding user to the list of participants

        console.log('Added user with this name');
        console.log(newUsername);
        room.participants.push({
            username:newUsername,
            tasks:selectedTasks,
            role: 'player'
        });
        await room.save();

        //const participantsNames = room.participants.map(a => a.username);

        //const io = getIO();
        //io.emit('participantsUpdate', participantsNames);

        //res.json({message: 'Successfully connected'});
        return res.status(200).json({
            message: 'Successfully connected',
            token,
            username: newUsername,
            roomname: roomname,
            mTPU:room.settings.maxTasksPerUser,
            tPU:room.settings.tasksPerUser,
            selectedTasks,
            gameEndsAt: room.settings.endsAt
        });
    } catch (error){
        console.error('Cannot connect',error);
        res.status(500).json({message:'Failed to connect', error});
    }
};//

module.exports = joinRoom;
