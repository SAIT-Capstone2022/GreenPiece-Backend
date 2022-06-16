const express = require('express');
const router = express.Router();
const User = require('../models/users');
const { application } = require('express');

//Get all users
router.get('/', async (req, res) => {

    try {
        const users = await User.find()
        res.json(users)
    } catch (err) {
        res.status(500).json({message: error.message})
    }
});

//Get one user
router.get('/:id', getUser, (req, res) => {
    res.send(res.user)
});

//Create one user
router.post('/', async (req, res) => {
    const user = new User({
        username: "steve",
        password: "password"
    })
        user.save((error) => {
            if (error) {
                console.log('Error Happened')
            } else {
                console.log('Data has been saved!');
            }
        })
});        

//Update one user
router.patch('/:id', getUser, async (req, res) => {
    if (req.body.username != null) {
        res.user.username = req.body.username
    }
    if (req.body.password != null) {
        res.user.password = req.body.password
    }
    try {
        const updatedUser = await res.user.save()
        res.json(updatedUser)
    } catch (err) {
        res.status(400).json({ message: err.message})
    }
});

//Delete one user
router.delete('/:id', getUser, async (req, res) => {
    try {
        await res.user.remove()
        res.json({ message: 'Deleted User'})
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
});

async function getUser(req, res, next) {
    let user
    try {
        user = await User.findById(req.params.id)
        if (user == null) {
            return res.status(404).json({ message: 'Cannot find user'})
        }
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }

    res.user = user
    next()
};

module.exports = router;