var axios = require('axios').default;
const fs = require('fs')
const replaceAll = require('string.prototype.replaceall');

const options = {
	url: 'https://horseman.ceru.dev/v1',
	token: 'PN-T6PeUK3ff'
}

const process = async () => {
	const all_posts = await axios.get(`${options.url}/models/posts/objects?key=${options.token}&expand=Author&limit=1000`)

	await fs.promises.mkdir('./data/posts', { recursive: true })
	await fs.promises.mkdir('./content/posts', { recursive: true })
	await fs.promises.mkdir('./content/authors', { recursive: true })

	await fs.promises.writeFile('./content/posts/_index.md', `---
    title: 'Blog'
    date: 2019-02-24
    menu:
        main:
            name: "Posts"
---`)

	await fs.promises.writeFile('./content/authors/_index.md', `---
title: 'Authors'
date: 2019-02-24
menu:
    main:
        name: "Authors"
---`)

	const all_authors = {}

	all_posts.data.results.map(post => {
		post.Author.slug = replaceAll(post.Author.Name.toLowerCase().replace(/[^a-z0-9]/g, '-'), '--', '-')
		all_authors[post.Author.id] = post.Author
		all_authors[post.Author.id].profile_image = post.Author.Image
		fs.writeFile(`./data/posts/${post.id}.json`, JSON.stringify(post), () => {})

		const metadata = Object.assign({}, post)
		delete metadata.Content

		metadata.slug = replaceAll(post.Title.toLowerCase().replace(/[^a-z0-9]/g, '-'), '--', '-')
		metadata.date = post.metadata.created_at
		metadata.Author = post.Author.Name

		metadata.feature_image = post.Image

		metadata.Author = post.Author.Name
		metadata.authors = [ post.Author.slug ]
		metadata.author_slug = post.Author.slug
		metadata.author_image = post.Author.Image
		fs.writeFile(`./content/posts/${post.id}.html`, `${JSON.stringify(metadata)}\n${post.Content}`, () => {})
	})

	Object.keys(all_authors).map(async author_id => {
		const author = all_authors[author_id]
		await fs.promises.mkdir(`./content/authors/${author.Name}`, { recursive: true })
		fs.writeFile(`./content/authors/${author.Name}/_index.md`, `${JSON.stringify(author)}\n${all_authors[author_id].Biography}`, () => {})
	})
}

process()