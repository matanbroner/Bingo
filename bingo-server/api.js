const router = require('express').Router();

router.post("/login", (req, res) => {
    return res.status(200).json({
        apiKey: "1234567890123456789012345678901234567890",
    });
});

router.post("/register", (req, res) => {
    return res.sendStatus(201);
});

module.exports = router;