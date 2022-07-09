var axios = require('axios').default;
const fs = require('fs')
const replaceAll = require('string.prototype.replaceall');

let config

try {
	config = fs.readFileSync('./config.json')
} catch (e) {
	console.log('No config file found. Please create a config.json when you wish to make changes! The config.example.json file will be overwriten when you pull new changes.')
	config = fs.readFileSync('./config.example.json')
}

const options = JSON.parse(config)

const process = async () => {
	const all_posts = await axios.get(`${options.HORSEMAN_URL}/models/posts/objects?key=${options.API_TOKEN}&expand=Author&limit=10000`)

	console.log('[HORSEMAN-HUGO] Deleting existing content directories...')

	const directories = [
		'./data/posts',
		'./content/authors',
		'./content/posts',
	].map(dir => {
		console.log(fs.existsSync(dir), dir)
		if (fs.existsSync(dir)) {
			fs.rmSync(dir, { recursive: true, force: true })
		}
		return dir
	})

	console.log('[HORSEMAN-HUGO] Creating directories...')

	await fs.promises.mkdir('./data/posts', { recursive: true })
	await fs.promises.mkdir('./content/posts', { recursive: true })
	await fs.promises.mkdir('./content/authors', { recursive: true })

	console.log('[HORSEMAN-HUGO] Writing header files...')

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
		console.log(`[HORSEMAN-HUGO] Processing post ${post.Title} (${post.id})`)

		post.Author.slug = post.Author.Slug || replaceAll(post.Author.Name.toLowerCase().replace(/[^a-z0-9]/g, '-'), '--', '-')
		all_authors[post.Author.id] = post.Author
		all_authors[post.Author.id].profile_image = post.Author.Image

		fs.writeFile(`./data/posts/${post.id}.json`, JSON.stringify(post), () => {})

		const metadata = Object.assign({}, post)
		delete metadata.Content

		metadata.slug = replaceAll(post.Title.toLowerCase().replace(/[^a-z0-9]/g, '-'), '--', '-')
		metadata.date = post.metadata.created_at
		metadata.Author = post.Author.Name

		metadata.feature_image = post.Image

		metadata.images = [ post.Image ] // for OpenGraph support, images must be an array

		metadata.Author = post.Author.Name
		metadata.authors = [ post.Author.slug ]
		metadata.author_slug = post.Author.slug
		metadata.author_image = post.Author.Image

		// 🔧 fix issue where blockquotes in website are borked.
		const content = replaceAll(post.Content, `</blockquote><blockquote>`, '<br/>')

		fs.writeFile(`./content/posts/${post.id}.html`, `${JSON.stringify(metadata)}\n${content}`, () => {})
	})

	Object.keys(all_authors).map(async author_id => {
		const author = all_authors[author_id]
		console.log(`[HORSEMAN-HUGO] Processing author ${author.Name} (${author.slug})`)
		await fs.promises.mkdir(`./content/authors/${author.slug}`, { recursive: true })
		fs.writeFile(`./content/authors/${author.slug}/_index.md`, `${JSON.stringify(author)}\n${all_authors[author_id].Biography}`, () => {})
	})

	console.log('[HORSEMAN-HUGO] Finished processing your data. You can now build your site!')
}

process().catch(e => {
	console.error(e)
})