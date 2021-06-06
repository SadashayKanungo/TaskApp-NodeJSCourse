const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task.js')

const jwtsecret = process.env.JWT_SECRET

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        default: 'Guest',
        trim: true
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if(value < 0){
                throw new Error('Age must be positive')
            }
        }
    },
    email: {
        type: String,
        unique: true,
        trim: true,
        lowercase: true,
        validate(value){
            if (! validator.isEmail(value)){
                throw new Error('Invalid Email')
            }
        }
    },
    password:{
        type: String,
        required: true,
        trim: true,
        validate(value){
            if((value.length <= 6) || (value.toLowerCase().includes('password'))){
                throw new Error('Password not strong enough')
            }
        }
    },
    tokens: [{
        token: {
            type:String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {timestamps: true})

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

userSchema.methods.toJSON = function() {
    const userObject = this.toObject()
    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar
    return userObject
}

userSchema.methods.generateToken = async function() {
    const token = jwt.sign({_id: this._id.toString()}, jwtsecret)
    this.tokens = this.tokens.concat({token})
    await this.save()
    return token
}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email})
    if(!user){
        throw new Error('User not found')
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if(!isMatch){
        throw new Error('Incorrect Password')
    }
    return user
}

userSchema.pre('save', async function(next){
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password, 8)
    }    
    next()
})

userSchema.pre('remove', async function(next) {
    await Task.deleteMany({owner: this._id})
    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User