const express = require('express');
const app = express();
const router = express.Router();
const { google } = require('googleapis');
const User = require('./models/Users');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);

const scopes = ['profile', 'email'];


router.get('/', async (req, res) => {
    try {
        const uri = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: scopes,
        });
        res.redirect(uri);
    } catch (err) {
        res.status(400).json({ message: 'Something went wrong. Try again' });
    }
});

router.get('/callback', async (req, res) => {
    try {
        const { tokens } = await oauth2Client.getToken(req.query.code);
        oauth2Client.setCredentials(tokens);
        const oauth2 = google.oauth2({
            auth: oauth2Client,
            version: 'v2'
        });
        const { data } = await oauth2.userinfo.get();
        const { email, name } = data;
        let user = await User.findOne({ email });
        if(!user) {
            user = new User({ email, accessToken: tokens.access_token, refreshToken: tokens.refresh_token, name });
            await user.save();
        }
        jwt.sign({ id:user._id }, 'privatekey', { expiresIn: '1w' }, (err, token) => {
            if (err) {
                console.log(err);
                res.status(500).json({ error: "Internal Server Error" });
            } else {
                res.cookie('token', token, { httpOnly: false });
                res.status(200).redirect('/gallery/'+token);
            }
        });
    } catch (err) {
        res.status(400).json({ message: 'Something went wrong. Try again' });
    }
});

module.exports = router;