function renderPosts(posts, page) {
	const el = document.getElementById('posts-list');

	const maxRows = maxPostRows(posts);

	if (((page - 1) * POSTS_PER_PAGE) > maxRows) {
		window.location.href = "/posts.html?page=" + parseInt(maxRows / POSTS_PER_PAGE);
	} else if (page < 1 || isNaN(page)) {
		window.location.href = "/posts.html?page=1";
	}

	const index = (page - 1) * POSTS_PER_PAGE;
	const slice = page * POSTS_PER_PAGE;

	let rows = generatePostRows(posts, index, slice);

	if (rows.length === 0) {
		el.innerHTML = '<div class="coming-soon">Coming Soon :)</div>';
		return;
	} else {
		const maxPages = parseInt(maxRows / POSTS_PER_PAGE);

		if (maxPages !== 0)
		{
			document.getElementById('posts-nav').style = '';

			if (maxPages >= 1 && page < maxPages) {
				document.getElementById('posts-next').innerHTML = 'next →'
				document.getElementById('posts-next').href = '/posts.html?page=' + (page + 1);
			}

			if (page > 1) {
				document.getElementById('posts-back').innerHTML = '← back';
				document.getElementById('posts-back').href = '/posts.html?page=' + (page - 1);
			}
		}
	}

	el.innerHTML = rows.join('');
}

async function init() {
	const params = new URLSearchParams(window.location.search);
	let page     = parseInt(params.get('page') ?? 1);
	try {
		const data  = await fetchTOML(DATA_URL);
		const posts = data.post ?? [];
		renderPosts(posts, page);
	} catch (err) {
		console.error('Failed to load site data:', err);
		document.getElementById('posts-list').innerHTML =
			'<div class="coming-soon">Failed to load posts.</div>';
	}
}

init();
