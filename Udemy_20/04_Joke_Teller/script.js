const button = document.getElementById('button');
const audioElement = document.getElementById('audio');

// disable / enable button
function toggleButton() {
	button.disabled = !button.disabled;
}

// pass joke to voiserss api
function tellMe(joke) {
	VoiceRSS.speech({
		key: '58fc109253c94aa0bff7aa10683ccebc',
		src: joke,
		hl: 'en-gb',
		v: 'Lily',
		r: 0,
		c: 'mp3',
		f: '44khz_16bit_stereo',
		ssml: false,
	});
}

// Get jokes from API
async function getJokes() {
	let joke = '';
	const apiURL =
		'https://v2.jokeapi.dev/joke/Christmas?blacklistFlags=nsfw,religious,political,racist,sexist,explicit';
	try {
		const res = await fetch(apiURL);
		const data = await res.json();
		if (data.setup) {
			joke = `${data.setup} ... ${data.delivery}`;
		} else {
			joke = data.joke;
		}
		// TTS
		tellMe(joke);
		// Disable button
		toggleButton();
	} catch (error) {
		console.log('This is broken', error);
	}
}

button.addEventListener('click', getJokes);
audioElement.addEventListener('ended', toggleButton);
