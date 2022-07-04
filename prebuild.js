var axios = require('axios').default;
const fs = require('fs')
const replaceAll = require('string.prototype.replaceall');

const options = {
	url: 'https://horseman.ceru.dev/v1',
	token: 'PN-T6PeUK3ff'
}

const process = async () => {
	const all_posts = await axios.get(`${options.url}/models/posts/objects?key=${options.token}&expand=Author&limit=1000`)
	console.log(`${options.url}/models/posts/objects?key=${options.token}&expand=Author&limit=1000`)

	console.log(all_posts)

	await fs.promises.mkdir('./data/posts', { recursive: true })
	await fs.promises.mkdir('./content/posts', { recursive: true })

	await fs.promises.writeFile('./content/posts/_index.md', `---
    title: 'Blog'
    date: 2019-02-24
    menu:
        main:
            name: "Posts"
---`)

	all_posts.data.results.map(post => {
		console.log(post)
		fs.writeFile(`./data/posts/${post.id}.json`, JSON.stringify(post), () => {})

		const metadata = Object.assign({}, post)
		delete metadata.Content

		metadata.slug = replaceAll(post.Title.toLowerCase().replace(/[^a-z0-9]/g, '-'), '--', '-')
		metadata.date = post.metadata.created_at

		fs.writeFile(`./content/posts/${post.id}.html`, `${JSON.stringify(metadata)}\n${post.Content}`, () => {})
	})
}

process()