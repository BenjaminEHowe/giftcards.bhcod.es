function addCard() {
	swal({
		"title": "Gift Card Brand",
		"input": "select",
		"inputOptions": getProvidersForSWAL(),
		"showCancelButton": true,
	}).then((result) => {
		if(result.dismiss) {
			return Promise.reject("Cancelled");
		}

		console.log(providers[result.value].requiredData);
	}).catch(function(error) {
		switch(error) {
			case "Cancelled":
				// if the user merely cancelled, do nothing
				break;
			
			default:
				console.log(error);
		}
	});
}

function displayGiftCards() {
	// if no giftcards are defined, don't do anything
	if (!giftcards) {
		return;
	}

	// TODO
}

function getProvidersForSWAL() {
	let providersForSWAL = new Object();
	Object.keys(providers).forEach(function(key) {
		providersForSWAL[key] = providers[key].name;
	});
	return providersForSWAL;
}

function showOptions() {
	// TODO
	swal({"title": "TODO"});
}

function updateProviders() {
	fetch("/api/providers").then(function(response) {
		// TODO: detect 429 etc.
		return response.text();
	}).then(function(body) {
		providersAsOf = new Date();
		providers = JSON.parse(body);
		localStorage.providersAsOf = providersAsOf;
		localStorage.providers = body;
	});
}

// define variables
let giftcards = localStorage.giftcards;
let providers = localStorage.providers;
let providersAsOf = localStorage.providersAsOf;

// parse data from localStorage
if (giftcards) {
	giftcards = JSON.parse(giftcards);
}

if (providersAsOf) {
	providersAsOf = new Date(providersAsOf);
}

if (providers && ((new Date().getTime() - providersAsOf.getTime()) / 1000) < 60 * 60 * 4) {
	// if providers exist and they're less than 4 hours old
	providers = JSON.parse(providers);
} else {
	updateProviders();
}

// display gift cards
displayGiftCards();

// bind event listeners
document.getElementById("addCard").addEventListener("click", addCard);
document.getElementById("showOptions").addEventListener("click", showOptions);
