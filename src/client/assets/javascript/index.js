// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
var store = {
	track_id: undefined,
	player_id: undefined,
	race_id: undefined,
}

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
	onPageLoad()
	setupClickHandlers()
});

async function onPageLoad() {
	try {
		getTracks()
			.then(tracks => {
				const html = renderTrackCards(tracks)
				renderAt('#tracks', html)
			})

		getRacers()
			.then((racers) => {
				const html = renderRacerCars(racers)
				renderAt('#racers', html)
			})
	} catch(error) {
		console.log("Problem getting tracks and racers ::", error.message)
		console.error(error)
	}
}

function setupClickHandlers() {
	document.addEventListener('click', function(event) {
		const { target } = event

		// Race track form field
		if (target.matches('.card.track')) {
			handleSelectTrack(target)
		}

		// Podracer form field
		if (target.matches('.card.podracer')) {
			handleSelectPodRacer(target)
		}

		// Submit create race form
		if (target.matches('#submit-create-race')) {
			event.preventDefault()

			// start race only if track and player/racer are selected
			if(store.player_id !== undefined && store.track_id !== undefined) {
				handleCreateRace();
			} else {
				alert("You need to select a Track and a Racer to begin the race!");
			}
		}

		// Handle acceleration click
		if (target.matches('#gas-peddle')) {
			handleAccelerate(target)
		}

	}, false)
}

async function delay(ms) {
	try {
		return await new Promise(resolve => setTimeout(resolve, ms));
	} catch(error) {
		console.log("an error shouldn't be possible here")
		console.log(error)
	}
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
	// render starting UI
	const selectedTrack = document.querySelector("#tracks > .selected");
	const selectedTrackName = selectedTrack.textContent.trim();
	renderAt('#race', renderRaceStartView({name: selectedTrackName}))
	const accelaretButton = document.getElementById("gas-peddle");

	const {player_id, track_id} = store;
	try {
		const race = await createRace(player_id, track_id);
		// Disable accelarate button before the count down ends
		accelaretButton.disabled = true;
		// For the API to work properly, the race id should be race id - 1
		store.race_id = race.ID - 1;
		// The race has been created, now start the countdown
		await runCountdown();
		// Enable accelerate button after count down ends
		accelaretButton.disabled = false;
		// Call the async function startRace
		const raceStartStatus = await startRace(store.race_id);
		if(raceStartStatus.status !== "OK") {
			throw new Error("Race could not be started, race id: " + store.race_id);
		}
		// Call the async function runRace
		await runRace(store.race_id);
	} catch(e) {
		console.error(e);
	}
}

function runRace(raceID) {
	return new Promise(resolve => {
		const segments = [];
	// TODO - use Javascript's built in setInterval method to get race info every 500ms
		const intervalId = setInterval(() => {
			getRace(raceID)
			.then(raceInfo => {
				const raceStatus = raceInfo.status;
				if(raceStatus.toLowerCase() === "in-progress") {
					renderAt('#leaderBoard', raceProgress(raceInfo.positions))
				} else if(raceStatus.toLowerCase() === "finished") {
					clearInterval(intervalId);
					renderAt('#race', resultsView(raceInfo.positions));
					resolve(raceInfo);
				}
			})
			.catch(e => {
				console.error("Race not found", e);
			})

		}, 500)
	});
}

async function runCountdown() {
	try {
		// wait for the DOM to load
		await delay(1000)
		let timer = 3

		return new Promise(resolve => {
			// Use Javascript's built in setInterval method to count down once per second
			const intervalId = setInterval(() => {
				document.getElementById('big-numbers').innerHTML = --timer;
				// If the countdown is done, clear the interval, resolve the promise, and return
				if(timer === 0) {
					clearInterval(intervalId);
					resolve();
				}
			}, 1000);

		})
	} catch(error) {
		console.error(error);
	}
}

function handleSelectPodRacer(target) {
	// remove class selected from all racer options
	const selected = document.querySelector('#racers .selected')
	if(selected) {
		selected.classList.remove('selected')
	}

	// add class selected to current target
	target.classList.add('selected')

	// TODO - save the selected racer to the store
	store.player_id = target.id;
}

function handleSelectTrack(target) {
	// remove class selected from all track options
	const selected = document.querySelector('#tracks .selected')
	if(selected) {
		selected.classList.remove('selected')
	}

	// add class selected to current target
	target.classList.add('selected')

	// TODO - save the selected track id to the store
	store.track_id = target.id;
}

async function handleAccelerate() {
	// Invoke the API call to accelerate

	try {
		const result = await accelerate(store.race_id);
		if(result.status !== "OK") {
			throw new Error("Acceleration failed, check gas");
		}
	} catch(e) {
		console.error("Unable to accelerate", e);
	}
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
	if (!racers.length) {
		return `
			<h4>Loading Racers...</4>
		`
	}

	const results = racers.map(renderRacerCard).join('')

	return `
		<ul id="racers">
			${results}
		</ul>
	`
}

function renderRacerCard(racer) {
	const { id, driver_name, top_speed, acceleration, handling } = racer

	return `
		<li class="card podracer" id="${id}">
			<h3>Name: ${driver_name}</h3>
			<p>Top Speed: ${top_speed}</p>
			<p>Acceleration: ${acceleration}</p>
			<p>Handling: ${handling}</p>
		</li>
	`
}

function renderTrackCards(tracks) {
	if (!tracks.length) {
		return `
			<h4>Loading Tracks...</4>
		`
	}

	const results = tracks.map(renderTrackCard).join('')

	return `
		<ul id="tracks">
			${results}
		</ul>
	`
}

function renderTrackCard(track) {
	const { id, name } = track

	return `
		<li id="${id}" class="card track">
			<h3>${name}</h3>
		</li>
	`
}

function renderCountdown(count) {
	return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`
}

function renderRaceStartView(track, racers) {
	return `
		<header>
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`
}

function resultsView(positions) {
	positions.sort((a, b) => (a.final_position > b.final_position) ? 1 : -1)

	return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			${raceProgress(positions)}
			<a href="/race">Start a new race</a>
		</main>
	`
}

/**
 *
 * @param {[*]} positions
 * @returns
 */
function raceProgress(positions) {
	let userPlayer = positions.find(e => e.id === parseInt(store.player_id))
	userPlayer.driver_name += " (you)"

	positions = positions.sort((a, b) => (a.segment > b.segment) ? -1 : 1)
	let count = 1

	const results = positions.map(p => {
		return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`
	});
	// There are 201 total segments, when the racer in the last position
	// reaches the 201st segement, the race ends
	const raceProgress = (positions.slice(-1).pop().segment / 201) * 100;
	return `
		<main>
			<h3>Leaderboard</h3>
			<section id="raceProgress">
				<h3>Race Progress: ${raceProgress.toFixed(2)}%</h3>
			</section>
			<section id="leaderBoard">
				${results.join("")}
			</section>
		</main>
	`
}

function renderAt(element, html) {
	const node = document.querySelector(element)

	node.innerHTML = html
}

// ^ Provided code ^ do not remove


// API CALLS ------------------------------------------------

const SERVER = 'http://localhost:8000'

function defaultFetchOpts() {
	return {
		mode: 'cors',
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin' : SERVER,
		},
	}
}

// TODO - Make a fetch call (with error handling!) to each of the following API endpoints

async function getTracks() {
	// GET request to `${SERVER}/api/tracks`
	try {
		const tracks = await fetch(`${SERVER}/api/tracks`);
		return await tracks.json();
	} catch(e) {
		throw new Error(e);
	}
}

async function getRacers() {
	// GET request to `${SERVER}/api/cars`
	try {
		const racers = await fetch(`${SERVER}/api/cars`);
		return await racers.json();
	} catch(e) {
		throw new Error(e);
	}
}

function createRace(player_id, track_id) {
	player_id = parseInt(player_id)
	track_id = parseInt(track_id)
	const body = { player_id, track_id }

	return fetch(`${SERVER}/api/races`, {
		method: 'POST',
		...defaultFetchOpts(),
		dataType: 'json',
		body: JSON.stringify(body)
	})
	.then(res => res.json())
	.catch(err => console.error("Problem with createRace request::", err))
}

async function getRace(id) {
	// GET request to `${SERVER}/api/races/${id}`
	if(id === NaN || typeof id !== 'number') {
		throw new Error("Incorrect race id");
	}
	try {
		const race = await fetch(`${SERVER}/api/races/${id}`);
		const raceJson = JSON.parse(await race.text());
		return raceJson;
	} catch(e) {
		throw new Error(e);
	}
}

async function startRace(id) {
	if(id === undefined || id === null) {
		throw new Error("race id cannot be undefined or null");
	}
	try {
		const r = await fetch(`${SERVER}/api/races/${id}/start`, {
			method: 'POST',
			...defaultFetchOpts(),
		});

		if(r.status >= 200 && r.status <= 210) {
			return {
				status: "OK",
				statusMessage: "Race started"
			}
		} else {
			return {
				status: "Failed",
				statusMessage: `Start race request resulted in ${r.status} code`
			}
		}
	} catch (err) {
		return console.error("Problem with start race request::", err)
	}
}

async function accelerate(id) {
	// POST request to `${SERVER}/api/races/${id}/accelerate`
	// options parameter provided as defaultFetchOpts
	// no body or datatype needed for this request
	try {
		const r = await fetch(`${SERVER}/api/races/${id}/accelerate`, {
			method: "POST",
			...defaultFetchOpts()
		});
		if(r.status >= 200 && r.status < 210) {
			return {
				status: "OK",
				statusMessage: "Acceleration successful!"
			}
		} else {
			return {
				status: "FAILED",
				statusMessage: "Acceleration failed!"
			}
		}
	} catch(e) {
		console.error(e);
	}
}
