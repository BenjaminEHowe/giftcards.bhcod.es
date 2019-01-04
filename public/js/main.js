function addCard() {
	var provider;
	swal({
		"title": "Gift Card Brand",
		"input": "select",
		"inputOptions": getProvidersForSWAL(),
		"showCancelButton": true,
	}).then((result) => {
		if(result.dismiss) {
			return Promise.reject("Cancelled");
		}
		return result.value;
	}).then((result) => {
		provider = providers[result];
		provider.slug = result;
		let swalQuestions = new Array();
		for(let i = 0; i < provider.requiredData.length; i++) {
			let question = new Object();
			question.title = provider.requiredData[i].fullName;
			question.inputValidator = (value) => {
				return (!value.match(new RegExp(provider.requiredData[i].validation)) ||
					!(provider.requiredData[i].slug != "pan" || validateLuhn(value))) &&
					`That doesn't appear to be a valid ${provider.requiredData[i].name}`;
			}
			swalQuestions.push(question);
		}

		return swal.mixin({
			"input": "text",
			"progressSteps": Array.from({length: swalQuestions.length}, (v, k) => k+1),
			"showCancelButton": true,
		}).queue(swalQuestions);
	}).then((result) => {
		if(result.dismiss) {
			return Promise.reject("Cancelled");
		}
		return result.value;
	}).then((result) => {
		let card = new Object();
		for (let i = 0; i < result.length; i++) {
			card[provider.requiredData[i].slug] = result[i];
		}
		card.slug = provider.slug;
		giftcards["Default"].push(card);
		localStorage.giftcards = JSON.stringify(giftcards);
		displayGiftCards();
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

	let table = document.createElement("table");
	table.id = "giftcardTable";
	tbody = document.createElement("tbody");
	for (let i = 0; i < giftcards["Default"].length; i++) {
		let tr = document.createElement("tr");
		{
			let td = document.createElement("td");
			let logo = document.createElement("img");
			logo.src = providers[giftcards["Default"][i].slug].logo;
			logo.alt = `${providers[giftcards["Default"][i].slug].name} logo`;
			td.appendChild(logo);
			tr.appendChild(td);
		}
		// TODO: name and balance
		tbody.appendChild(tr);
	}
	table.appendChild(tbody);
	document.getElementById("mainContainer").innerHTML = "";
	document.getElementById("mainContainer").appendChild(table);
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

function validateLuhn(value) {
	// source: https://gist.github.com/DiegoSalazar/4075533
	// accept only digits, dashes or spaces
	if (/[^0-9-\s]+/.test(value)) return false;
	// The Luhn Algorithm. It's so pretty.
	var nCheck = 0, nDigit = 0, bEven = false;
	value = value.replace(/\D/g, "");
	for (var n = value.length - 1; n >= 0; n--) {
		var cDigit = value.charAt(n),
			nDigit = parseInt(cDigit, 10);
		if (bEven) {
			if ((nDigit *= 2) > 9) nDigit -= 9;
		}
		nCheck += nDigit;
		bEven = !bEven;
	}
	return (nCheck % 10) == 0;
};

// define variables
let giftcards = localStorage.giftcards;
let providers = localStorage.providers;
let providersAsOf = localStorage.providersAsOf;

// parse data from localStorage
if (giftcards) {
	giftcards = JSON.parse(giftcards);
} else {
	giftcards = new Object();
	giftcards["Default"] = new Array();
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
