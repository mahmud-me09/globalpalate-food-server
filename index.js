const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
require('dotenv').config()
const cors = require("cors")
const app = express();
const port = 3000;

app.get("/", (req, res) => {
	res.send("Hello World!");
});

app.use(
	cors({
		origin: [
			"http://localhost:5173",
			// "https://cardoctor-bd.web.app",
			// "https://cardoctor-bd.firebaseapp.com",
		],
		credentials: true,
	})
);
const cookieOptions = {
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",
	sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};
//creating Token

const uri = `mongodb+srv://${process.env.USER_ID}:${process.env.PASS}@cluster0.z9uu5lq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

async function run() {
	try {
		// Connect the client to the server	(optional starting in v4.7)
		await client.connect();
		// Send a ping to confirm a successful connection
		await client.db("admin").command({ ping: 1 });
		console.log(
			"Pinged your deployment. You successfully connected to MongoDB!"
		);

		// app.post("/jwt", async (req, res) => {
		// 	const user = req.body;
		// 	console.log("user for token", user);
		// 	const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);

		// 	res.cookie("token", token, cookieOptions).send({
		// 		success: true,
		// 	});
		// });

		//clearing Token
		// app.post("/logout", async (req, res) => {
		// 	const user = req.body;
		// 	console.log("logging out", user);
		// 	res.clearCookie("token", { ...cookieOptions, maxAge: 0 }).send({
		// 		success: true,
		// 	});
		// });
	} finally {
		// Ensures that the client will close when you finish/error
		// await client.close();
	}
}
run().catch(console.dir);

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});
