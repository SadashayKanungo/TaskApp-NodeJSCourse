const express = require('express')
const Task = require('../models/task.js')
const auth = require('../middleware/auth.js')

const router = new express.Router()

// supports queries completed{bool}, limit{int}, skip{int}, sortby{createdAt, completed : descend, ascend}
router.get('/tasks', auth, async (req,res) => {
    const match = {}
    if(req.query.completed){
        match.completed = req.query.completed === 'true'
    }
    const sort = {}
    if(req.query.sortby){
        const parts = req.query.sortby.split(':')
        sort[parts[0]] = (parts[1] === 'ascend') ? 1 : -1
    }
    
    try{
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)
    }
    catch(e){
        res.status(500).send()
    }
})

router.get('/tasks/:id', auth, async (req,res) => {
    try{
        const task = await Task.findOne({_id:req.params.id, owner:req.user._id})
        if(!task){
            return res.status(404).send()
        }
        res.send(task)
    }
    catch(e){
        res.status(500).send()
    }
})

router.post('/tasks', auth, async (req,res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })
    try{
        await task.save()
        res.status(201).send(task)
    }
    catch(e){
        res.status(400).send(e)
    }
})

router.patch('/tasks/:id', auth, async (req,res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    if ( ! updates.every((update) => allowedUpdates.includes(update))){
        res.status(400).send({error: 'Invalid Update'})
    }
    
    try{
        const task = await Task.findOne({_id:req.params.id, owner:req.user._id})
        if(!task){
            return res.status(404).send()
        }
        updates.forEach((update) => task[update] = req.body[update])
        await task.save()
        res.send(task)
    }
    catch(e){
        res.status(400).send()
    }
})

router.delete('/tasks/:id', auth, async (req,res) => {
    try{
        const task = await Task.findOneAndDelete({_id:req.params.id, owner:req.user._id})
        if(!task){
            return res.status(404).send()
        }
        res.send(task)
    }
    catch(e){
        res.status(400).send()
    }
})


module.exports = router