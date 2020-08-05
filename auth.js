const express = require('express');
const app = express();

// DATABASE
const users = [
    {
        username: 'john',
        password: 'password123admin',
        role: 'admin'
    }, {
        username: 'anna',
        password: 'password123member',
        role: 'member'
    }
];

const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

app.use(bodyParser.json());

const accessTokenSecret = process.env.RAND_TOKEN;
const refreshTokenSecret = process.env.REFRESH_TOKEN;
const refreshTokens = [];



app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const user = users.find(u => {
        return u.username === username && u.password === password;
    });

    if (user) {
        const accessToken = jwt.sign({username: user.username, role: user.role}, 
                                    accessTokenSecret);
        const refreshToken = jwt.sign({ username: user.username, role: user.role },
                                    refreshTokenSecret);
        refreshTokens.push(refreshToken);

        res.json({
            accessToken
        });
    } else {
        res.send('Username or password incorrect');
    }
});

app.post('/token', (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.sendStatus(401);
    }

    if (!refreshTokens.includes(token)) {
        return res.sendStatus(403);
    }

    jwt.verify(token, refreshTokenSecret, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        
        const accessToken = jwt.sign({username: user.username, role: user.role}, accessTokenSecret,
                                    { expiresIn: '20m' });
        
        res.json({
            accessToken
        })
    })
})

app.post('/logout', (req, res) => {
    const { token } = req.body;
    refreshTokens = refreshTokens.filter(t => t !== token);

    res.send("Logout successful");
});

app.listen(3000, () => {
    console.log('Auth service started on port 3000');    
});
