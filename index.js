const express = require("express");
require("dotenv").config();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 5000;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(express.json());
app.use(cookieParser());

const verifyToken = (req, res, next) => {
	const token = req?.cookies?.token;
	if (!token) return res.status(401).send({ message: "unauthorized access" });
	if (token) {
		jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
			if (error) {
				console.log(error);
			}
			console.log(decoded);
			req.user = decoded;
			next();
		});
	}
};

app.use(
	cors({
		origin: [
			"http://localhost:5173",
			"https://globalpalate-a11-client.firebaseapp.com",
			"https://globalpalate-a11-client.web.app",
		],
		credentials: true,
		optionsSuccessStatus:200
	})
);

// app.use((req, res, next) => {
// 	res.header({ "Access-Control-Allow-Origin": "*" });
// 	next();
// });

const cookieOptions = {
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",
	sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};

const uri = `mongodb+srv://${process.env.USER_ID}:${process.env.PASS}@cluster0.z9uu5lq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

async function run() {
	try {
		// await client.connect();

		// await client.db("admin").command({ ping: 1 });
		// console.log(
		// 	"Pinged your deployment. You successfully connected to MongoDB!"
		// );

		const foodsCollection = client.db("globalpalate").collection("foods");
		const feedbackCollection = client
			.db("globalpalate")
			.collection("feedback");
		const purchaseCollection = client
			.db("globalpalate")
			.collection("purchase");
		const usersCollection = client
			.db("globalpalate")
			.collection("user");

		app.get("/", (req, res) => {
			res.send("Hello World!");
		});

		// User Related Info:

		app.get("/user", async(req,res)=>{
			
			const user = await usersCollection.find().toArray()
			res.send(user)
		})

		app.post("/user", async(req,res)=>{
			const user = req.body;
			const result = await usersCollection.insertOne(user);
			res.send(result);
		})

		app.delete("/user", async(req,res)=>{
			const result = await usersCollection.deleteMany();
			res.send(result)
		})

		

		app.get("/food/:email", verifyToken, async (req, res) => {
			const tokenEmail = req.user?.email;

			const paramEmail = req.params.email;
			console.log(tokenEmail, paramEmail);
			if (tokenEmail !== paramEmail)
				return res.status(403).send({ message: "Forbidden access" });
			else {
				try {
					let query = { "add_by.email": paramEmail };
					const foods = await foodsCollection.find(query).toArray();
					res.send(foods);
				} catch (error) {
					console.error("Error searching foods:", error);
					res.status(500).json({ error: "Internal server error" });
				}
			}
		});
		app.get("/foods", async (req, res) => {
			try {
				let query = {};
				if (req.query?.name) {
					query = {
						name: {
							$regex: new RegExp(req.query.name, "i"),
						},
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
			const food = await foodsCollection.findOne(query);
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

		app.patch("/foods/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const count = { $inc: { purchaseCount: 1 } };
			const result = await foodsCollection.updateOne(query, count);
			res.send(result);
		});

		app.delete("/foods/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const result = await foodsCollection.deleteOne(query);
			res.send(result);
		});

		// galary-collection
		app.get("/feedback", async (req, res) => {
			const feedback = await feedbackCollection.find().toArray();
			res.send(feedback);
		});

		app.post("/feedback", async (req, res) => {
			const feedback = req.body;
			const result = await feedbackCollection.insertOne(feedback);
			res.send(result);
		});

		// food Purchase

		app.get("/purchase", verifyToken, async (req, res) => {
			const tokenEmail = req.user?.email;
			if (tokenEmail !== req.query?.email)
				return res.status(403).send({ message: "Forbidden access" });
			else {
				try {
					let query = {};
					if (req.query?.email) {
						query = req.query.email
							? { "buyer.email": req.query.email }
							: {};
					}
					const purchase = await purchaseCollection
						.find(query)
						.toArray();
					res.send(purchase);
				} catch (error) {
					console.error("Error searching foods:", error);
					res.status(500).json({ error: "Internal server error" });
				}
			}
		});

		app.get("/purchase/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const purchase = await purchaseCollection.findOne(query);
			res.send(purchase);
		});

		app.post("/purchase", async (req, res) => {
			const purchase = req.body;
			const result = await purchaseCollection.insertOne(purchase);
			res.send(result);
		});

		app.delete("/purchase/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const result = await purchaseCollection.deleteOne(query);
			res.send(result);
		});

		// Authentication token

		app.post("/jwt", async (req, res) => {
			const user = req.body;

			const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
				expiresIn: "7d",
			});

			res.cookie("token", token, cookieOptions).send({
				success: true,
			});
		});

		// clearing Token
		app.get("/logout", async (req, res) => {
			const user = req.body;
			res.clearCookie("token", { ...cookieOptions, maxAge: 0 }).send({
				success: true,
			});
		});

		app.listen(port, () => {
			console.log(`this app listening on port ${port}`);
		});
	} finally {
		// Ensures that the client will close when you finish/error
		// await client.close();
	}
}
run().catch(console.dir);
