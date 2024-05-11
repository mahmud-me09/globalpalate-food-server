const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const cors = require("cors");
const app = express();
const port = 3000;

app.use(express.json());

app.use(
	cors({
		origin: [
			"http://localhost:5173",
			"https://globalpalate-a11-client.firebaseapp.com",
			"https://globalpalate-a11-client.web.app",
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

		const foodsCollection = client.db("globalpalate").collection("foods");
		// const doc = { name: "Red", town: "kanto" };
		// const result = await movies.insertOne(doc);
		// console.log(
		// 	`${result.insertedCount} documents were inserted with the _id: ${result.insertedId}`
		// );

		app.get("/foods", async (req, res) => {
			try {
				let query = {};
				if (req.query?.email || req.query?.name) {
					query = {
						$and: [
							req.query.email
								? { "add_by.email": req.query.email }
								: {},
							req.query.name
								? {
										name: {
											$regex: new RegExp(
												req.query.name,
												"i"
											),
										},
								  }
								: {},
						],
					};
				}
				const foods = await foodsCollection.find(query).toArray();
				res.send(foods);

			} catch (error) {
				console.error("Error searching foods:", error);
				res.status(500).json({ error: "Internal server error" });
			}
		});

		app.get("/foods/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const food = foodsCollection.findOne(query);
			res.send(food);
		});

		app.post("/foods", async (req, res) => {
			const food = req.body;
			const result = await foodsCollection.insertOne(food);
			res.send(result);
		});

		app.put("/foods/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const updatedFoodData = { $set: req.body };
			const option = { upsert: true };
			const result = await foodsCollection.updateOne(
				query,
				updatedFoodData,
				option
			);
			res.send(result);
		});

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
