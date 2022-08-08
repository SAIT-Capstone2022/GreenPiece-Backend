const router = require('express').Router();
const { User, validate } = require('../models/user');
const Token = require("../models/token");
const bcrypt = require('bcrypt');
const sendEmail = require('../utils/sendEmail')
const crypto = require('crypto')


router.post("/", async (req, res) => {
	try {
		const { error } = validate(req.body);
		if (error)
			//  console.log(error);
			return res.status(400).send({ message: error.details[0].message });


		let user = await User.findOne({ email: req.body.email });
		if (user)
			return res
				.status(409)
				.send({ message: "User with the given email already Exists!" });

		const salt = await bcrypt.genSalt(Number(process.env.SALT));
		const hashPassword = await bcrypt.hash(req.body.password, salt);

		user = await new User({ ...req.body, password: hashPassword }).save();

		const token = await new Token({
			userId: user._id,
			token: crypto.randomBytes(32).toString("hex"),
		}).save();
		const url = `${process.env.BASE_URL}/users/${user.id}/verify/${token.token}`;
		await sendEmail(user.email, "Verify Email", url);

		res
			.status(201)
			.send({ message: "An Verification link has been sent to your email account, please verify." });
	} catch (error) {
		console.log(error);
		res.status(500).send({ message: "Internal Server Error" });
	}
});

router.get("/:id/verify/:token/", async (req, res) => {
	try {
		const user = await User.findOne({ _id: req.params.id });

		if (!user) return res.status(400).send({ message: "Invalid link" });

		const token = await Token.findOne({
			userId: user._id,
			token: req.params.token,
		});

		if (!token) return res.status(400).send({ message: "Invalid link" });

		await User.updateOne({ _id: user._id }, { verified: true });
		await token.remove();

		res.status(200).send({ message: "Email verified successfully" });
	} catch (error) {
		res.status(500).send({ message: "Internal Server Error" });
	}
});

//profile update method

// to-do setup ensurance that user changing user data is logged in

router.post("/profile-update", async (req, res) => {

	const post = req.body;

	const updateUser = await User.findOne({ _id: post._id });

	if (!updateUser) {
		res.status(400).send({ message: "User Error Problem" });
	};

	await User.updateOne({ _id: post._id }, { username: post.username, password: post.password, phonenumber: post.phonenumber , city: post.city});

	const user = await User.findOne({ _id: post._id });

	res.status(200).send({ message: "Profile successfully updated", user: user });

});

//Water update method

router.post("/water-update", async (req, res) => {
	const post = req.body;

	const date = new Date();
	const wateredAt = { "day": date.getDate(), "month": (date.getMonth() + 1), "year": date.getFullYear() };
	await User.findOneAndUpdate({ _id: post._id }, { $addToSet: { waterHistoryLog: wateredAt } });

	const user = await User.findOne({ _id: post._id });

	res.status(201).send({ message: "Successfully updated watering log.", user: user });
});

//Greenhouse variable alert update method

router.post("/GreenhouseAlertValues", async (req, res) => {

	const user = await User.findOneAndUpdate({ _id: req.body._id }, {
		 prefMaxTemp: req.body.prefMaxTemp, prefMinTemp: req.body.prefMinTemp, 
			prefMaxHumidity: req.body.prefMaxHumidity, prefMinHumidity: req.body.prefMinHumidity,
			prefMaxMoisture: req.body.prefMaxMoisture, prefMinMoisture: req.body.prefMinMoisture}, {
				returnDocument: "after"
			}
		);

	

	res.status(201).send({ message: "Successfully updated prefered alert values.", user: user  });
});

module.exports = router;