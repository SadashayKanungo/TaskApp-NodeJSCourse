const express = require('express')
const jwt = require('jsonwebtoken')
const auth = require('../middleware/auth.js')
const multer = require('multer')
const sharp = require('sharp')

const User = require('../models/user.js')

const router = new express.Router()

router.get('/users/me', auth, async (req,res) => {
    res.send(req.user)
})

router.post('/users', async (req,res) => {
    const user = new User(req.body)
    
    try{
        await user.save()
        const token = await user.generateToken()
        res.status(201).send({user, token})
    }
    catch(e){
        res.status(400).send(e)
    }
})

router.patch('/users/me', auth, async (req,res) => {
    const allowedUpdates = ['name', 'password', 'email', 'age']
    const updates = Object.keys(req.body)
    if ( ! updates.every((update) => allowedUpdates.includes(update))){
        return res.status(400).send({error: 'Invalid Update'})
    }
    try{
        // const user = await User.findById(req.params.id)
        // if(!user){
        //     return res.status(404).send('User not found')
        // }
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    }
    catch(e){
        res.status(400).send()
    }
})

router.delete('/users/me', auth, async (req,res) => {
    try{
        //const user = await User.findByIdAndDelete(req.user._id)
        await req.user.remove()
        res.send(req.user)
    }
    catch(e){
        res.status(500).send()
    }
})

router.post('/users/login', async (req,res)=>{
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateToken()
        res.send({user, token})
    }
    catch(e){
        console.log(e)
        res.status(400).send('Unable to Login')
    }
    
})

router.post('/users/logout', auth, async (req,res)=>{
    try{
        req.user.tokens = req.user.tokens.filter((token) => token.token != req.token)
        await req.user.save()
        res.send('Logged Out')
    }
    catch(e){
        res.status(500).send()
    }
})

router.post('/users/logoutall', auth, async (req,res)=>{
    try{
        req.user.tokens = []
        await req.user.save()
        res.send('Logged Out from all Sessions')
    }
    catch(e){
        res.status(500).send()
    }
})

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req,file,cb){
        if(! file.originalname.match(/\.(png|jpg|jpeg)$/)){
            return cb(new Error('File must be JPG ar PNG'))
        }
        cb(undefined, true)
        //cb(new Error('File must be JPG, JPEG or PNG'))
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req,res)=>{
    const buffer = await sharp(req.file.buffer).resize({width:250, height:250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error,req,res,next)=>{
    res.status(400).send({error: error.message})
})

router.delete('/users/me/avatar', auth, async (req,res)=>{
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.get('/users/:id/avatar', async (req,res)=>{
    try{
        const user = await User.findById(req.params.id)
        if(!user || !user.avatar){
            throw new Error()
        }
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    }
    catch(e){
        res.status(404).send()
    }
})

module.exports = router