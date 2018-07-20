//entry point of the game
function main() {
	/*Performance object,
	1. increments moves
	2. starts timer
	3. decrements stars
	4. dumps all info into a modal
	5. hide/display modal
	6. reset the performance to initial state
	*/
	let performance = {
		modal: document.getElementsByClassName("modal")[0],
		timer: document.getElementsByClassName("timer")[0],
		stars: document.getElementsByClassName("stars")[0],
		moves: document.getElementsByClassName("moves")[0],
		intervalID: null,
		starsCount: 3,

		incrementTimer: function() {
			this.timer.innerText = parseInt(this.timer.innerText) + 1;
		},
		startTimer: function() {
			 this.intervalID = setInterval(()=>this.incrementTimer(), 1000);
		},
		stopTimer: function() {
			if(this.intervalID !== null) {
				clearInterval(this.intervalID);
				this.intervalID = null;
			}
		},
		incrementMoves: function() {
			let count = parseInt(this.moves.innerText) + 1;
			this.moves.innerText = count;
			if(!(count%14) && (count <= 42))
				this.decrementStars();
		},
		decrementStars: function() {
			let starList = this.stars.children;
			this.starsCount = this.starsCount - 1;
			starList[this.starsCount].classList.replace("gold", "black");
		},
		dumpToModal: function() {
			this.stopTimer();
			let modalStars = this.modal.getElementsByClassName("modal-stars")[0];
			let modalTimer = this.modal.getElementsByClassName("modal-timer")[0];
			let modalStarsList = modalStars.children;
			for(let i = 0; i < 3; i++) {
				if(i < this.starsCount)
					modalStarsList[i].classList.replace("black", "gold");
				else {
					modalStarsList[i].classList.remove("gold");
					modalStarsList[i].classList.add("black");
				}
			}
			modalTimer.textContent = this.timer.textContent + "  Seconds";
		},
		showModal: function() {
			this.dumpToModal();
			this.modal.classList.replace("modal-hide", "modal-show");
		},
		hideModal: function() {
			this.modal.classList.replace("modal-show", "modal-hide");
		},
		reset: function() {
			this.stopTimer();
			this.timer.innerText = 0;
			let starList = this.stars.children;
			for(let i = 2; i >= this.starsCount; i--) {
				starList[i].classList.replace("black", "gold");
			}
			this.starsCount = 3;
			this.moves.innerText = 0;
			this.hideModal();
			this.startTimer();
		}
	}

	let container = document.getElementsByClassName("container")[0];//get continer, deck and cards
	let deck = document.getElementsByClassName("deck")[0];
	let cards = [...deck.children];
	let resetButtons = document.getElementsByClassName("restart");
	[...resetButtons].forEach(button => button.addEventListener("click", ()=> {deck = init(cards, deck, container, performance);}))
	deck = init(cards, deck, container, performance);//initilize the game
}

//resets the stats and adds event listener to the new deck
function init(cards, deck, container, performance) {
	let matchedListItems = [];		//matched pairs stored here
	let openListItem = [];			//card, looking to be paired with immediate upcoming card
	let bombList = [];				/*list of items that are soon to be hidden after mismatch,
									 events are blocked on them*/
	deck = prepareNewDeck(cards, deck, container);//prepare new deck
	performance.reset();
	deck.addEventListener("click",
		cardEvent.bind(null,openListItem, matchedListItems, bombList, performance));	//add event listener on the new deck for flipping cards
	return deck;
}

//creats a new deck with shuffled cards
function prepareNewDeck(cards, deck, container) {
	let newDeck = deck.cloneNode(false);	//create a clone of the deck (false-shallow copy)

	hideCards(cards)						//hide cards before shuffle
	cards = shuffle(cards);					//shuffle cards
	cards.forEach(card => newDeck.appendChild(card));	//append shuffled cards to newDeck
	container.replaceChild(newDeck, deck);				//replace old deck with newDeck
	return newDeck;
}

//function called when clicked on deck
function cardEvent(openListItem, matchedListItems, bombList, performance, event) {
	if(!bombList.includes(event.target)) {										//check if the card is about to be closed(visually)
		if(isListUniqueItem(event.target, openListItem, matchedListItems)) {	//check if the card is already selected or matched
			match(openListItem, event.target, openListItem, matchedListItems, bombList, performance);//if the card is unique call match
		}
	} else {
		console.log("Bomb List activated: ", bombList);
	}
}

//function to check if the card clicked is not already selected or matched
function isListUniqueItem(targetItem, openListItem, matchedListItems) {
	if(targetItem.nodeName === "LI") {
		if(!openListItem.includes(targetItem) && !matchedListItems.includes(targetItem)) {
			return true;
		}
	}
	return false;
}

//displays the clicked card, tries to match the card clicked with previous clicked card
function match(openListItem, targetItem, openListItem, matchedListItems, bombList, performance) {
	let targetCard = targetItem.firstElementChild;	//get the target card
	let targetSymbol = targetCard.classList[1];		//get the target symbol
	let openItem = openListItem[0];					//get the previous un-matched opend card item if it exists
	let openCard = null;

	if(openListItem.length) {							//if a card to be paired is already selected, and target is 2nd in that pair
		performance.incrementMoves();
		openCard = openItem.firstElementChild;			//firstElementChild holds the card
		if(openCard.classList.contains(targetSymbol)){	//if openCard contains same symbol as the target
			matchedListItems.push(openItem, targetItem);//push both to matched list
			openListItem.shift();						//remove the first card as a pair is selected
			show(targetItem);							//open the target card
			if(matchedListItems.length === 16) {		//if all 16 cards are matched
				performance.showModal();
			}
		} else {
			show(targetItem);									//if they dont match, show the target card once. and  close it
			openListItem.shift();								//both the cards in a pair are closed, so, openListItem is emptied for next pair
			bombList.push(openItem, targetItem);				//push the pair to bombList indicating both are being closed and event on them is blocked
			setTimeout(hideCards, 700, [openItem, targetItem], bombList);	//after 700ms close both the cards
		}
	} else {
		openListItem.push(targetItem);	//if the target is firs one forming a pair push it to open list
		show(targetItem);				//show the target item
	}

}

//function that shows the card
function show(listItem) {
	listItem.classList.add("open");
}

/*function, hides array of cards,
	if bombList is passed, after hiding them,
	remove a pair from bomblist after hiding. */
function hideCards(cards, bombList = []) {
	cards.forEach(card => card.classList.remove("open")); //loop through cards and remove specified classes
	if(bombList.length) {
		bombList.shift();
		bombList.shift();
	}
}

// Shuffle function from http://stackoverflow.com/a/2450976
function shuffle(array) {
    let currentIndex = array.length, temporaryValue, randomIndex;

    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}




//start the game
main();