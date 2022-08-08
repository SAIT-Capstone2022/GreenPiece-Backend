const nodemailer = require("nodemailer");

module.exports = async (email, subject, text) => {
	try {
		const transporter = nodemailer.createTransport({
			host: "smpt.gmail.com",
			service: process.env.SERVICE,
			port: 465,
			secure: Boolean(process.env.SECURE),
			type:"oauth2",
			auth: {
				user: process.env.USER,
				pass: process.env.PASS
			},
		});

		await transporter.sendMail({
			from: process.env.USER,
			to: email,
			subject: subject,
			text: text,
		});
		console.log("email sent successfully");
	} catch (error) {
		console.log("email not sent!");
		console.log(error);
		return error;
	}
};