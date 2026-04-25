function reelHTB(posts) {
	const el = document.getElementById('htb-grid');

	const max = maxHTBCards(posts);
	if (!max) {
		el.innerHTML = '<div class="htb-card-ghost coming-soon">Coming Soon :)</div><div class="htb-card-ghost"></div><div class="htb-card-ghost"></div>';
		return;
	}

	const slice = max === 6 ? 6 : 5;
	const cards = generateHTBCards(posts, 0, slice);
	const reelCards = cards.slice(0, slice);

	if (max >= 7) {
		reelCards.push(`
		<a class="post-row" href="/posts.html">
			<div class="post-idx">${pad(6)}</div>
			<div class="post-title">Want more? - Click here to see all of the posts I've made :3</div>
			<div class="post-date"></div>
		</a>
		`);
	}

	el.innerHTML = reelCards.join('');
}

function reelPosts(posts) {
	const el = document.getElementById('posts-list');

	const max = maxPostRows(posts);
	if (!max) {
		el.innerHTML = '<div class="coming-soon">Coming Soon :)</div>';
		return;
	}

	const slice = max === 6 ? 6 : 5;
	const rows = generatePostRows(posts, 0, slice);
	const reelRows = rows.slice(0, slice);

	if (max >= 7) {
		reelRows.push(`
		<a class="post-row" href="/posts.html">
			<div class="post-idx">${pad(6)}</div>
			<div class="post-title">Want more? - Click here to see all of the posts I've made :3</div>
			<div class="post-date"></div>
		</a>
		`);
	}

	el.innerHTML = reelRows.join('');
}

async function renderCerts() {
	const wrap    = document.getElementById('cert-table-wrap');
	const loading = document.getElementById('cert-loading');

	let md;
	try {
		const res = await fetch(CERTIFICATE_TABLE);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		md = await res.text();
	} catch (err) {
		loading.textContent = 'Failed to load certifications.';
		console.error('Cert fetch error:', err);
		return;
	}

	const tableStart = md.indexOf('<table>');
	const tableEnd   = md.lastIndexOf('</table>') + '</table>'.length;
	if (tableStart === -1 || tableEnd === -1) {
		loading.textContent = 'Certifications table not found.';
		return;
	}
	const rawTable = md.slice(tableStart, tableEnd);

	const parser  = new DOMParser();
	const doc     = parser.parseFromString(rawTable, 'text/html');
	const srcTable = doc.querySelector('table');
	if (!srcTable) {
		loading.textContent = 'Could not parse certifications.';
		return;
	}

	const table = document.createElement('table');
	table.className = 'cert-table';

	const thead = document.createElement('thead');
	const hrow  = document.createElement('tr');
	['Badge', 'Abbr.', 'Full Name', 'Obtained', 'Link'].forEach(label => {
		const th = document.createElement('th');
		th.textContent = label;
		hrow.appendChild(th);
	});
	thead.appendChild(hrow);
	table.appendChild(thead);

	const tbody = document.createElement('tbody');
	const allRows = Array.from(srcTable.querySelectorAll('tr'));
	const srcRows = allRows.slice(1, allRows.length - 1);

	srcRows.forEach(srcRow => {
		const cells = Array.from(srcRow.querySelectorAll('td'));
		if (!cells.length) return;

		const tr = document.createElement('tr');

		cells.forEach((cell, i) => {
			const td = document.createElement('td');

			if (i === 0) {
				const img = cell.querySelector('img');
				if (img) {
					const el = document.createElement('img');
					el.src       = CERTIFICATE_TABLE_ROOT + img.getAttribute('src');
					el.alt       = img.getAttribute('alt') || '';
					el.className = 'cert-badge';
					td.appendChild(el);
				}
			} else if (i === 1) {
				td.className = 'cert-abbr';
				td.innerHTML = cell.innerHTML.trim();
			} else if (i === 2) {
				td.innerHTML = cell.innerHTML.trim();
			} else if (i === 3) {
				const dateText = cell.textContent.trim();
				td.className = 'cert-date';
				td.textContent = dateText;
			} else if (i === 4) {
				const anchor = cell.querySelector('a');
				if (anchor) {
					const a = document.createElement('a');
					a.href      = anchor.href;
					a.target    = '_blank';
					a.rel       = 'noopener';
					a.className = 'cert-link';
					a.textContent = 'Link';
					td.appendChild(a);
				}
			}

			tr.appendChild(td);
		});

		tbody.appendChild(tr);
	});

	table.appendChild(tbody);

	try {
		wrap.removeChild(loading);
		wrap.appendChild(table);
	} catch (err) {
		console.error("Failed to swap loading indicator");
	}
}

async function init() {
	try {
		const data  = await fetchTOML(DATA_URL);
		const posts = data.post ?? [];
		reelHTB(posts);
		reelPosts(posts);
		await renderCerts();
	} catch (err) {
		console.error('Failed to load site data:', err);
		document.getElementById('posts-list').innerHTML =
			'<div class="coming-soon">Failed to load posts.</div>';
	}
}

init();
