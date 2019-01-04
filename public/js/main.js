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
		card.data = new Object();
		for (let i = 0; i < result.length; i++) {
			card.data[provider.requiredData[i].slug] = result[i];
		}
		card.slug = provider.slug;
		giftcards["Default"].push(card);
		localStorage.giftcards = JSON.stringify(giftcards);
		updateGiftCard("Default", giftcards["Default"].length - 1).then(() => {displayGiftCards()});
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
	if (!giftcards["Default"].length) {
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
		{
			let td = document.createElement("td");
			let name = undefined;
			if (giftcards["Default"][i].name) {
				name = document.createTextNode(giftcards["Default"][i].name);
			} else {
				name = document.createTextNode(`${providers[giftcards["Default"][i].slug].name} gift card`);
			}
			td.appendChild(name);
			tr.appendChild(td);
		}
		{
			let td = document.createElement("td");
			let balance = undefined;
			try {
				balance = document.createTextNode(
					new Intl.NumberFormat(
						navigator.language,
						{
							style: "currency",
							currency: giftcards["Default"][i].currency,
						}
					).format(giftcards["Default"][i].balance));
			} catch(e) {
				balance = document.createTextNode("error");
			}
			td.appendChild(balance);
			tr.appendChild(td);
		}
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

function updateGiftCard(tab, index) {
	return fetch(`/api/${giftcards[tab][index].slug}/getBalance`, {
		"method": "POST",
		"headers": {
			"Content-Type": "application/json",
		},
		"body": JSON.stringify(giftcards[tab][index].data),
	}).then(function(result) {
		return result.json();
	}).then(function(json) {
		console.log(json);
		giftcards[tab][index].balance = json.balance;
		giftcards[tab][index].currency = json.currency;
		giftcards[tab][index].balanceAsOf = new Date();
		localStorage.giftcards = JSON.stringify(giftcards);
	});
}

function updateGiftCards() {
	let promises = new Array();
	Object.keys(giftcards).forEach(function(key) {
		for(let i = 0; i < giftcards[key].length; i++) {
			if (((new Date().getTime() - new Date(giftcards[key][i].balanceAsOf).getTime()) / 1000) > 60 * 5) {
				// if the balance is more than 5 minutes old, refresh it
				promises.push(updateGiftCard(key, i));
			}
		}
	});
	return Promise.all(promises);
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

// upadte & display gift cards
updateGiftCards().then(() => {displayGiftCards()});

// bind event listeners
document.getElementById("addCard").addEventListener("click", addCard);
document.getElementById("showOptions").addEventListener("click", showOptions);
