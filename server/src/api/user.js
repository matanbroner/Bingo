const express = require("express");
const bcrypt = require("bcrypt");
const uuidV4 = require("uuid").v4;

const crypto = require("../crypto");
const db = require("../db")

let router = express.Router({mergeParams: true});

router.post("/", async (req, res) => {
    const {
        email,
        password,
        publicKey,
    } = req.body;
    if (!email || !password) {
        return res.finish(400, "Missing email or password");
    }
    if (!publicKey) {
        return res.finish(400, "Missing public key");
    }
    // Validate email
    const isEmail = /^[^@]+@[^@]+\.[^@]+$/
    if (!isEmail.test(email)) {
        return res.finish(400, "Invalid email");
    }
    // Validate password
    if (password.length < 8) {
        return res.finish(400, "Password must be at least 8 characters");
    }
    // Check password strength (uppercase, lowercase, number, special character)
    const validators = {
        uppercase: /[A-Z]/,
        lowercase: /[a-z]/,
        number: /[0-9]/,
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    }
    if (!Object.values(validators).some(v => v.test(password))) {
        return res.finish(400, "Password must contain at least one uppercase, lowercase, number, and special character");
    }
    // SHA256 hash email for anonymity
    const hashEmail = crypto.sha256(email);
    // Bcrypt password
    const hashPassword = bcrypt.hashSync(password, 10);
    // Create user
    try {
        // Do not store password, pass it to relay server
        await db.dbInsert("users", {
            id: uuidV4(),
            email: hashEmail,
            publicKey
        })
        // TODO: Send password to relay server
    res.finish(201, "OK");
    } catch (err) {
        // Do not disclose error to client, would allow for brute force attack on email hashes
        global.logger.debug(err);
        return res.finish(400, "Invalid Registration");
    }
});

router.post("/login", async (req, res) => {
    const {
        email,
        password,
    } = req.body;
    if (!email || !password) {
        return res.finish(400, "Missing email or password");
    }
    // DB stores hashed email
    const hashEmail = crypto.sha256(email);
    // Login process
    try {
        const user = await db.dbGet("users", {
            email: hashEmail
        })
        if (!user) {
            throw new Error("User not found");
        }

        // TODO: async fetch password from relay server through peers

        // Check if password matches
        if (!bcrypt.compareSync(password, user.password)) {
            throw new Error("Password does not match");
        }
        res.finish(200, "OK");
    } catch (err) {
        // Do not disclose error to client, would allow for brute force attack on email hashes
        global.logger.debug(err);
        return res.finish(400, "Invalid Login");
    }
})

module.exports = router;