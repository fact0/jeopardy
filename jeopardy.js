// add sound class:
class Sound {
	constructor(src) {
		this.sound = document.createElement("audio");
		this.sound.src = src;
		this.sound.setAttribute("preload", "auto");
		this.sound.setAttribute("controls", "none");
		this.sound.style.display = "none";
		document.body.appendChild(this.sound);
	}
	play() {
		this.sound.play();
	}
	stop() {
		this.sound.pause();
	}
	duck() {
		this.sound.volume = 0.5;
	}
	full() {
		this.sound.volume = 1;
	}
}

// categories is the main data structure for the app; it looks like this:
const api_url = "https://jservice.io/api/";
const num_catagories = 6;
const num_clues = 5;
//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

let categories = [];

/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids, uses method from lodash to get random categories from id:
 */

async function getCategoryIds() {
	let res = await axios.get(`${api_url}categories?count=100`);
	let catIds = res.data.map((c) => c.id);
	return _.sampleSize(catIds, num_catagories);
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */
async function getCategory(catId) {
	// calls api and runs spinner
	let res = await axios
		.get(`${api_url}category?id=${catId}`)
		.then(showLoadingView());
	let cat = res.data;
	let allClues = cat.clues;
	let randomClues = _.sampleSize(allClues, num_clues);
	let clues = randomClues.map((c) => ({
		question: c.question,
		answer: c.answer,
		showing: null,
	}));

	return { title: cat.title, clues };
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */

async function fillGrid() {
	// Add categories
	$("#game").empty();
	for (let catIdx = 0; catIdx < num_catagories; catIdx++) {
		let $div = $("<div>").text(categories[catIdx].title).addClass("cat-div");
		$("#game").append($div);
	}

	// Add  questions for each category
	for (let clueIdx = 0; clueIdx < num_clues; clueIdx++) {
		for (let catIdx = 0; catIdx < num_catagories; catIdx++) {
			let $div = $("<div>")
				.attr("id", `${catIdx}-${clueIdx}`)
				.text("?")
				.addClass("clue-div");
			$("#game").append($div);
		}
	}
	// hides spinner
	hideLoadingView();
}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick(e) {
	let id = e.target.id;
	let [catId, clueId] = id.split("-");
	let clue = categories[catId].clues[clueId];

	let msg;

	if (!clue.showing) {
		msg = clue.question;
		clue.showing = "question";
	} else if (clue.showing === "question") {
		msg = clue.answer;
		clue.showing = "answer";
	} else {
		return;
	}

	// Update text of cell
	$(`#${catId}-${clueId}`).html(msg);
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {
	$("#spin-container").show();
}

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView() {
	$("#spin-container").hide();
}

// a bunch of elements fade in on game start:
function elementsFadeIn() {
	$("i").addClass("playing fade-in");
	$(".container").addClass("fade-in");
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
	let catIds = await getCategoryIds();
	categories = [];
	for (let catId of catIds) {
		categories.push(await getCategory(catId));
	}
	fillGrid().then(elementsFadeIn());
	start.classList.add("playing");
}

/** On click of restart button, restart game. */

$("#restart").on("click", setupAndStart);
$("#reset-button").on("click", function () {
	setupAndStart();
});

/** On page load, setup and start & add event handler for clicking clues */
// select start button and start game on click by creating new Game from class:
$(async function () {
	$("#start").on("click", setupAndStart);
	$("#game").on("click", ".clue-div", handleClick);
});
