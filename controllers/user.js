const User = require('../models/user.js');

async function addUser(user) {
    try {
        const foundUser = await User.find({name: user.name});
        if (!foundUser) {
            throw new Error();
        }
        console.error('err', `User already saved`);
        return foundUser.uid;
    } catch {
        const newUser = new User(user);
        try {
            const user = await newUser.save();
        } catch (err) {
            console.error('err', `res /users ${JSON.stringify(err)}`);
        }
    }
}

async function getUsers({
    id = null
} = {
    id: null
}) {
    if (id) {
        try {
            const user = await User.findById(id);
            if (!user) {
                console.error('err', `User by id ${id} not found`);

                res.status(404).json({
                    message: `User by id ${id} not found`
                });
                return;
            }
            res.status(200).json(user);
        } catch (err) {
            res.status(404).json(err);
        }
    } else {
        try {
            const user = await User.find({});

            if (!user) {
                console.error('err', "No record found");

                res.status(404).json({
                    message: "No record found"
                });
                return;
            }
            res.status(200).json(user);
        } catch (err) {
            console.error('err', `res /users ${JSON.stringify(err)}`);
            res.status(400).json(err);
        }
    }
}

module.exports.addUser = addUser;
module.exports.getUsers = getUsers;