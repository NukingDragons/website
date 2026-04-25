function renderHTB(posts, page) {
	const el = document.getElementById('htb-grid');

	const maxCards = maxHTBCards(posts);

	if (((page - 1) * HTB_CARDS_PER_PAGE) > maxCards) {
		window.location.href = "/writeups.html?page=" + parseInt(maxCards / HTB_CARDS_PER_PAGE);
	} else if (page < 1 || isNaN(page)) {
		window.location.href = "/writeups.html?page=1";
	}

	const index = (page - 1) * HTB_CARDS_PER_PAGE;
	const slice = page * HTB_CARDS_PER_PAGE;

	let cards = generateHTBCards(posts, index, slice);

	if (cards.length === 0) {
		el.innerHTML = '<div class="coming-soon">Coming Soon :)</div>';
		return;
	} else {
		const maxPages = parseInt(maxCards / HTB_CARDS_PER_PAGE);

		if (maxPages !== 0)
		{
			document.getElementById('posts-nav').style = '';

			if (maxPages >= 1 && page < maxPages) {
				document.getElementById('posts-next').innerHTML = 'next →'
				document.getElementById('posts-next').href = '/writeups.html?page=' + (page + 1);
			}

			if (page > 1) {
				document.getElementById('posts-back').innerHTML = '← back';
				document.getElementById('posts-back').href = '/writeups.html?page=' + (page - 1);
			}
		}
	}

	el.innerHTML = cards.join('');
}

async function init() {
	const params = new URLSearchParams(window.location.search);
	let page     = parseInt(params.get('page') ?? 1);
	try {
		const data  = await fetchTOML(DATA_URL);
		const posts = data.post ?? [];
		renderHTB(posts, page);
	} catch (err) {
		console.error('Failed to load site data:', err);
		document.getElementById('posts-list').innerHTML =
			'<div class="coming-soon">Failed to load posts.</div>';
	}
}

init();
