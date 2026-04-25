function decrypt(input, key) {
	const decoded = CryptoJS.enc.Base64.parse(input);
	const decrypted = CryptoJS.AES.decrypt({ ciphertext: decoded }, CryptoJS.enc.Utf8.parse(key), {
		mode: CryptoJS.mode.ECB,
		padding: CryptoJS.pad.Pkcs7
	});
	return decrypted.toString(CryptoJS.enc.Utf8);
}

function showError(msg) {
	document.getElementById('post-error').style.display   = 'block';
	document.getElementById('post-error-msg').textContent = msg;
}

function showLockedError(msg) {
	document.getElementById('post-error').style.display   = 'block';
	document.getElementById('key-error').textContent = msg;
}

function populateHeader(post) {
	document.title = `NukingDragons — ${post.title}`;
	document.getElementById('post-category').innerHTML = `<span>//</span> ${post.category}`;
	document.getElementById('post-date').textContent   = formatDate(post.date);
	document.getElementById('post-title').textContent  = post.title;

	if (post.category === 'HTB' && (post.difficulty || post.os)) {
		const metaBar = document.getElementById('post-htb-meta');
		const diffEl  = document.getElementById('htb-difficulty');
		const osEl    = document.getElementById('htb-os');
		metaBar.style.display = 'flex';
		if (post.difficulty) {
			diffEl.className   = `tag tag-${post.difficulty.toLowerCase()}`;
			diffEl.textContent = post.difficulty;
		}
		if (post.os) {
			osEl.textContent = post.os;
		}
	}
}

function render(html) {
	const content = document.getElementById('post-content');
	content.innerHTML = html;
	Prism.highlightAll();
	content.style.display = 'block';
	document.getElementById('post-license').style.display = 'block';
}

async function checkSessionAndRender(post) {
	let validate = "";
	let html = "";
	let description = "";
	try {
		let res = await fetch("posts/" + post.path + "/validate");
		if (!res.ok) throw new Error(`Could not load writeup validation (${res.status})`);
		validate = await res.text();

		res = await fetch("posts/" + post.path + "/description");
		if (!res.ok) throw new Error(`Could not load writeup description (${res.status})`);
		description = await res.text();

		res = await fetch("posts/" + post.path + "/post.html");
		if (!res.ok) throw new Error(`Could not load writeup (${res.status})`);
		html = await res.text();
	} catch(err) {
		showError(err.message);
		console.error(err);
		return err;
	}

	const key = sessionStorage.getItem(`${post.path}-key`);

	if (decrypt(validate, key) === "validate") {
		document.getElementById('post-desc').textContent = decrypt(description, key);

		render(decrypt(html, key));
		return true;
	} else {
		sessionStorage.removeItem(`${post.path}-key`);
		return false;
	}
}

async function showLocked(post) {
	document.getElementById('post-desc').style.display = 'none';
	document.getElementById('locked-shell').style.display = 'flex';
	document.getElementById('locked-sub').textContent = post.description.substring(27);

	const input = document.getElementById('key-input');
	const btn   = document.getElementById('key-btn');
	const errEl = document.getElementById('key-error');

	let validate = "";
	let html = "";
	let description = "";
	try {
		let res = await fetch("posts/" + post.path + "/validate");
		if (!res.ok) throw new Error(`Could not load writeup validation (${res.status})`);
		validate = await res.text();

		res = await fetch("posts/" + post.path + "/description");
		if (!res.ok) throw new Error(`Could not load writeup description (${res.status})`);
		description = await res.text();

		res = await fetch("posts/" + post.path + "/post.html");
		if (!res.ok) throw new Error(`Could not load writeup (${res.status})`);
		html = await res.text();
	} catch(err) {
		showLockedError(err.message);
		console.error(err);
	}

	async function attempt() {
		const key = input.value.trim();
		if (!key) return;

		if (decrypt(validate, key) === "validate") {
			sessionStorage.setItem(`${post.path}-key`, key);
			document.getElementById('locked-shell').style.display = 'none';
			document.getElementById('post-desc').style.display = '';
			document.getElementById('post-desc').textContent = decrypt(description, key);

			render(decrypt(html, key));
		} else {
			errEl.style.display     = 'block';
			input.style.borderColor = 'rgba(255,107,115,0.5)';
			setTimeout(() => {
				errEl.style.display     = 'none';
				input.style.borderColor = '';
			}, 2500);
		}
	}

	btn.addEventListener('click', attempt);
	input.addEventListener('keydown', e => { if (e.key === 'Enter') attempt(); });
}

async function init() {
	let data;
	try {
		data = await fetchTOML(DATA_URL);
	} catch (err) {
		showError('Could not load site data.');
		console.error(err);
		return;
	}

	const params = new URLSearchParams(window.location.search);
	const path   = params.get('post');

	if (!path) {
		showError('No post specified.');
		return;
	}

	const posts = data.post ?? [];
	const post  = posts.find(p => p.path === path);

	if (!post) {
		window.location.href = "/";
	}

	populateHeader(post);

	const isActive = post.category === 'HTB' && post.active === true;

	try {
		let res = await fetch("posts/" + post.path + "/post.html");
		if (!res.ok) throw new Error(`Could not load writeup (${res.status})`);
		let html = await res.text();

		if (isActive) {
			res = await checkSessionAndRender(post);
			if (res === false) {
				showLocked(post);
			}
		} else {
			document.getElementById('post-desc').textContent = post.description;
			render(html);
		}
	} catch(err) {
		showError(err.message);
		console.error(err);
	}
}

init();
