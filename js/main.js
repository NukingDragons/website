const TOML = (() => {
	function parse(src) {
		const result = {};
		let currentArray = null;
		let currentTable = null;

		for (let raw of src.split('\n')) {
			const line = raw.split('#')[0].trim();
			if (!line) continue;

			if (line.startsWith('[[') && line.endsWith(']]')) {
				const key = line.slice(2, -2).trim();
				if (!result[key]) result[key] = [];
				currentTable = {};
				result[key].push(currentTable);
				currentArray = key;
				continue;
			}

			if (line.startsWith('[') && line.endsWith(']')) {
				currentTable = {};
				currentArray = null;
				const key = line.slice(1, -1).trim();
				result[key] = currentTable;
				continue;
			}

			const eq = line.indexOf('=');
			if (eq === -1) continue;

			const key = line.slice(0, eq).trim();
			const raw_val = line.slice(eq + 1).trim();
			let value;

			if (raw_val.startsWith('"') || raw_val.startsWith("'")) {
				const q = raw_val[0];
				value = raw_val.slice(1, raw_val.lastIndexOf(q));
			} else if (raw_val === 'true') {
				value = true;
			} else if (raw_val === 'false') {
				value = false;
			} else {
				value = raw_val;
			}

			const target = currentTable ?? result;
			target[key] = value;
		}

		return result;
	}

	return { parse };
})();

async function fetchTOML(url) {
	const res = await fetch(url, { cache: 'reload' });
	if (!res.ok) throw new Error(`Could not fetch ${url} (${res.status})`);
	return TOML.parse(await res.text());
}

function pad(n) {
	return String(n).padStart(3, '0');
}

function formatDate(str) {
	if (!str) return '';
	const [year, month, day] = str.split('-');
	if (!month) return year;
	const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
	if (!day) return `${names[parseInt(month, 10) - 1]} ${year}`;
	return `${names[parseInt(month, 10) - 1]} ${pad(parseInt(day, 10))} ${year}`;
}

function parseDate(str) {
	if (!str) return 0;
	const parts = str.split('-');
	const year  = parseInt(parts[0], 10);
	const month = parseInt(parts[1], 10);
	const day   = parseInt(parts[2], 10);
	return new Date(year, month, day).getTime();
}

function isRecentlyRetired(m) {
	if (m.active) return false;
	const retiredTime = parseDate(m.retired);
	const cutoff = Date.now() - (RECENTLY_RETIRED_DAYS * 24 * 60 * 60 * 1000);
	return retiredTime >= cutoff;
}

function htbSortKey(m) {
	const d = parseDate(m.date);
	const r = parseDate(m.retired);
	return isRecentlyRetired(m) === true ? r : d;
}

function lockSVG() {
	return `<svg class="lock-icon" viewBox="0 0 16 16" fill="#ff979d" xmlns="http://www.w3.org/2000/svg">
		<path fill-rule="evenodd" d="M8 0a4 4 0 0 1 4 4v2.05a2.5 2.5 0 0 1 2 2.45v5a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 2 13.5v-5a2.5 2.5 0 0 1 2-2.45V4a4 4 0 0 1 4-4M4.5 7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 7zM8 1a3 3 0 0 0-3 3v2h6V4a3 3 0 0 0-3-3"/>
	</svg>`;
}

function unlockSVG() {
	return `<svg class="lock-icon" viewBox="0 0 16 16" fill="#9b8cff" xmlns="http://www.w3.org/2000/svg">
		<path fill-rule="evenodd" d="M12 0a4 4 0 0 1 4 4v2.5h-1V4a3 3 0 1 0-6 0v2h.5A2.5 2.5 0 0 1 12 8.5v5A2.5 2.5 0 0 1 9.5 16h-7A2.5 2.5 0 0 1 0 13.5v-5A2.5 2.5 0 0 1 2.5 6H8V4a4 4 0 0 1 4-4M2.5 7A1.5 1.5 0 0 0 1 8.5v5A1.5 1.5 0 0 0 2.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 9.5 7z"/>
	</svg>`;
}

function maxHTBCards(posts) {
	return posts.filter(p => p.category === 'HTB').sort((a, b) => htbSortKey(b) - htbSortKey(a)).length;
}

function generateHTBCards(posts, index, slice) {
	const machines = posts
		.filter(p => p.category === 'HTB')
		.sort((a, b) => htbSortKey(b) - htbSortKey(a));

	if (machines.length === 0) {
		return [];
	}

	let iHateCssCounter = 0;
	let iHateCssClass = " htb-card-top";
	let cards = machines.slice(index, slice).map(m => {
		const diffClass = `tag-${(m.difficulty ?? '').toLowerCase()}`;
		let tags = "";
		if (m.difficulty) {
			tags += `<span class="tag ${diffClass}">${m.difficulty}</span>`;
		}
		if (m.os) {
			tags += `<span class="tag tag-os">${m.os}</span>`;
		}

		const icon = m.active ? lockSVG() : unlockSVG();
		const recentLabel = isRecentlyRetired(m)
			? '<div class="card-recently-retired"><span>//</span> recently retired</div>'
			: '';

		if (iHateCssCounter !== 3) {
			iHateCssCounter++;
		} else {
			iHateCssClass = "";
		}

		return `
			<a class="htb-card${iHateCssClass}" href="/post.html?post=${encodeURIComponent(m.path)}">
				<div class="card-top">
					<div class="card-name">${m.title}</div>
					${icon}
				</div>
				<div class="card-tags">${tags}</div>
				<div class="card-date">${formatDate(m.date)}</div>
				<div class="card-desc">${m.description}</div>
				${recentLabel}
			</a>
		`;
	});

	const remainder = cards.length % 3;
	const ghosts = remainder === 0 ? 0 : 3 - remainder;

	for (let i = 0; i < ghosts; i++) {
		cards.push('<div class="htb-card-ghost"></div>');
	}

	return cards;
}

function maxPostRows(posts) {
	return posts.filter(p => p.category !== 'HTB').sort((a, b) => parseDate(b.date) - parseDate(a.date)).length;
}

function generatePostRows(posts, index, slice) {
	const filtered = posts
		.filter(p => p.category !== 'HTB')
		.sort((a, b) => parseDate(b.date) - parseDate(a.date));

	if (!filtered.length) {
		return [];
	}

	let iHateCssCounter = 0;
	let iHateCssClass = " post-row-top";
	const rows = filtered.slice(index, slice).map((p, i) => {
		if (iHateCssCounter !== 1) {
			iHateCssCounter++;
		} else {
			iHateCssClass = "";
		}

		return `
			<a class="post-row${iHateCssClass}" href="/post.html?post=${encodeURIComponent(p.path)}">
				<div class="post-idx">${pad(index + (i + 1))}</div>
				<div class="post-title">${p.title}</div>
				<div class="post-date">${formatDate(p.date)}</div>
			</a>
		`;
	});

	return rows;
}
