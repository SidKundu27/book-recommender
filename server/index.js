const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios');
const app = express()

let book = [];
let genre = "";
let recommendations = []

// Configuring body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/api/getBook", (req, res) => {
	res.status(200)
	if (genre === "") {
		res.status(204)
	}
	res.send({ book, genre })
})

app.post("/api/findBook", (req, res) => {
	const bookTitle = req.body.bookTitle
	axios
		.get('https://www.googleapis.com/books/v1/volumes', {
			params: {
				q: `intitle:${bookTitle}`,
			},
		})
		.then((response) => {
			book = response.data.items[0].volumeInfo;
			genre =
				book.categories && book.categories.length > 0
					? book.categories[0]
					: 'Unknown';
			res.status(200).send({
				book: book,
				genre: genre,
			});
		})
		.catch((error) => {
			res.status(404).send(error);
		});
})

app.get('/api/getBookRecommendation', (req, res) => {
	if (genre === "") {
		res.status(404).send("Error: No Genre Found")
	}

	axios.get('https://www.googleapis.com/books/v1/volumes', {
		params: {
			q: `subject:${genre}`,
			maxResults: 5,
		},
	})
		.then((response) => {
			const items = response.data.items;
			const bookIds = items.map((item) => item.id);
			const bookDetailsRequests = bookIds.map((id) =>
				axios.get(`https://www.googleapis.com/books/v1/volumes/${id}`)
			);
			axios.all(bookDetailsRequests).then(
				axios.spread((...responses) => {
					recommendations = responses.map(
						(response) => response.data.volumeInfo
					);
					res.status(200).send(recommendations);
				})
			);
		});
});

app.listen(5000, () => { console.log("Server Started on port 5000") })