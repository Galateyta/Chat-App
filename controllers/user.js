const User = require('../models/user.js');


async function addUser(user) {
    try {
        const foundUser = await User.find({
            name: user.name
        });
        if (foundUser.length === 0) {
            throw new Error();
        }

        console.log(`User already saved`);
        return foundUser[0].uid;
    } catch {
        const newUser = new User(user);
        try {
            const user = await newUser.save();
        } catch (err) {
            console.error('err', `res /users ${JSON.stringify(err)}`);
        }
    }
}

async function getUsers(body) {
    try {
        const user = await User.find(body);

        if (!user) {
            console.error('err', "No record found");
            throw new Error();
        }

        return user;
    } catch (err) {
        console.error('err', `res /users ${JSON.stringify(err)}`);
    }
}

async function updateUser(body, update) {
    try {
        await User.updateMany(body, update, {runValidators: true});
        return 0;
    } catch (err) {
        return err;
    }
}

module.exports.addUser = addUser;
module.exports.getUsers = getUsers;
module.exports.updateUser = updateUser;