const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = express();
const path = require('path');
const engine = require('ejs-mate');
const User = require('./models/Users');
require('dotenv').config();

app.use(express.json());

app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public',{ 'content-type': 'image/svg+xml' }));
mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log('Connected to DB!');
}).catch(err => {
    console.log('ERROR:', err.message);
});

app.use('/google', require('./auth'));

app.get('/', (req, res) => {
    res.render('home');
});

app.post('/upload/:token', async (req, res) => {
    const { token } = req.params;
    const { url } = req.body;
    if(!url) {
        return res.status(422).json({ error: "Please add all the fields" });
    }
    if(!token) {
        res.render('login');
    }
    jwt.verify(token, 'privatekey', async (err, decoded) => {
        if(err) {
            res.render('login');
        } else {
            console.log(decoded)
            const user = await User.findById(decoded.id);
            console.log("user",user);
            if(!user) {
                return res.render('login');
            }
            user.images.push(url);
            await user.save();
            res.json({ message: 'Image uploaded successfully' });
        }
    });
});

app.get('/gallery/:token', async (req, res) => {
    const { token } = req.params;
    if(!token) {
        res.redirect('/login');
    }
    jwt.verify(token, 'privatekey', async (err, decoded) => {
        if(err) {
            res.redirect('/login');
        } else {
            const user = await User.findById(decoded.id);
            if(!user) {
                return res.render('login');
            }
            res.render('gallery',{images:user.images});
        }
    });
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if(!email || !password) {
        return res.status(422).json({ error: "Please add all the fields" });
    }
    const user = await User.findOne({ email, password });
    if(!user) {
        return res.status(422).json({ error: "Invalid Credentials" });
    }
    jwt.sign({ id:user._id }, 'privatekey', { expiresIn: '1w' }, (err, token) => {
        if (err) {
            console.log(err);
            res.status(500).json({ error: "Internal Server Error" });
        } else {
            res.status(200).json({ token });
        }
    });
});

app.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(422).json({ error: "Please add all the fields" });
    }
    const user = await new User({ email, password });
    try {
        console.log(user);
        const newUser = await user.save();
        console.log(newUser);
        jwt.sign({ id:newUser._id }, 'privatekey', { expiresIn: '1w' }, (err, token) => {
            if (err) {
                console.log(err);
                res.status(500).json({ error: "Internal Server Error" });
            } else {
                res.status(200).json({ token });
            }
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.all('*', (req,res) => {
    res.render('home');
})


app.listen(3000, () => {
    console.log('Example app listening on port 3000!');
});

