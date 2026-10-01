/*!
 * CSS3 Card Games Example
 * http://gamedesign.cc/html5games/CSS3-matching-game/
 * 
 * This is an example game for the book HTML5 Games Development: A Beginning Guide.
 * 
 * Copyright 2010, Thomas Seng Hin Mak
 * makzan@gmail.com
 *   
 * All Right Reserved.
 */
 
// a global object to hold all global variables related to the game.
var matchingGame = {};

// we are going to information that need to be saved inside this saving object.
// The information includse the game status. 
// Information such as which card is in which position and which one is deleted.
matchingGame.savingObject = {};

// an array to store the deck, it is bascially a clone of the matchingGame.deck.
matchingGame.savingObject.deck = [];

// an array to store which card is removed by storing their index.
matchingGame.savingObject.removedCards = [];

// store the counting elapsed time.
matchingGame.savingObject.currentElapsedTime = 0;


// all possible values for each card in deck
matchingGame.deck = [
	'cardAK', 'cardAK',
	'cardAQ', 'cardAQ',
	'cardAJ', 'cardAJ',
	'cardBK', 'cardBK',
	'cardBQ', 'cardBQ',
	'cardBJ', 'cardBJ',	
];

// every code inside $(function(){}) will be run 
// after the DOM is loaded and ready.
$(function(){	

	// shuffling the deck
	matchingGame.deck.sort(shuffle);
	
	// re-create the saved deck
	var savedObject = savedSavingObject();
	if (savedObject != undefined)
	{
		matchingGame.deck = savedObject.deck;
	}
	
	// copying the deck into saving object.
	matchingGame.savingObject.deck = matchingGame.deck.slice();
	
	// clone 12 copies of the card DOM
	for(var i=0;i<11;i++){
		$(".card:first-child").clone().appendTo("#cards");
	}
	
	// initialize each card
	$("#cards").children().each(function(index) {		
		// align the cards to be 4x4 ourselves.
		$(this).css({
			"left" : ($(this).width()  + 20) * (index % 4),
			"top"  : ($(this).height() + 20) * Math.floor(index / 4)
		});
		
		// get a pattern from the shuffled deck
		var pattern = matchingGame.deck.pop();
		
		// visually apply the pattern on the card's back side.
		// the pattern value is actually a CSS class with the
		// corrisponding playing card graphic.
		$(this).find(".back").addClass(pattern);
		
		// embed the pattern data into the DOM element.
		$(this).data("pattern",pattern);
		
		// save the index into the DOM element, so we know which card it is later.
		$(this).attr("data-card-index",index);
						
		// listen the click event on each card DIV element.
		$(this).click(selectCard);				
	});
	
	// removed cards that were removed in savedObject.
	if (savedObject != undefined)
	{
		matchingGame.savingObject.removedCards = savedObject.removedCards; 
		// find those cards and remove them.
		for(var i in matchingGame.savingObject.removedCards)
		{			
			$(".card[data-card-index="+matchingGame.savingObject.removedCards[i]+"]").remove();
		}
	}

	// reset the elapsed time to 0.
	matchingGame.elapsedTime = 0;
	
	// restore the saved elapsed time
	if (savedObject != undefined)
	{
		matchingGame.elapsedTime = savedObject.currentElapsedTime; 
		matchingGame.savingObject.currentElapsedTime = savedObject.currentElapsedTime;
	}
			
	// start the timer
	matchingGame.timer = setInterval(countTimer, 1000);

});

// execute every second to count the elapsed time
function countTimer()
{

	matchingGame.elapsedTime++;
	
	// save the current elapsed time into savingObject.
	matchingGame.savingObject.currentElapsedTime = matchingGame.elapsedTime;
		
	// calculate the minutes and seconds from elapsed time
	var minute = Math.floor(matchingGame.elapsedTime / 60);
	var second = matchingGame.elapsedTime % 60;	
	
	// add padding 0 if minute and second is less then 10
	if (minute < 10) minute = "0" + minute;
	if (second < 10) second = "0" + second;
	
	// display the elapsed time
	$("#elapsed-time").html(minute+":"+second);
	
	// save the game progress
	saveSavingObject();
}

function selectCard() {
	// we do nothing if there are already two card flipped.
	if ($(".card-flipped").size() > 1)
	{
		return;
	}
	
	// add the class "card-flipped".
	// the browser will animate the styles between current state and card-flipped state.
	$(this).addClass("card-flipped");
	
	// check the pattern of both flipped card 0.7s later.
	if ($(".card-flipped").size() == 2)
	{
		setTimeout(checkPattern,700);
	}
}

// a function to return random number between -0.5 to 0.5
function shuffle()
{
	// returning a random number in sort function.
	// the sort function determine by eiter possitive number and negative number.
	// Math.random() range from 0 - 1, 0.5 - Math.random() results eiter possitive or negative number.	
	return 0.5 - Math.random();
}

// a function to do action when both cards match
function checkPattern()
{
	if (isMatchPattern())
	{
		$(".card-flipped").removeClass("card-flipped").addClass("card-removed");
		
		// delete the card DOM node after the transition finished.
		$(".card-removed").bind("webkitTransitionEnd", removeTookCards);
	}
	else
	{
		$(".card-flipped").removeClass("card-flipped");
	}
}

// a function to delete all removed cards
function removeTookCards()
{
	// add each removed card into the array which store which cards are removed
	$(".card-removed").each(function(){
		matchingGame.savingObject.removedCards.push($(this).data("cardIndex"));
		$(this).remove();
	});		
	
	// check if all cards are removed and show game over
	if ($(".card").length == 0)
	{
		gameover();
	}
	
}

// a function to check if the flipped card match the pattern.
function isMatchPattern()
{
	var cards = $(".card-flipped");
	var pattern = $(cards[0]).data("pattern");
	var anotherPattern = $(cards[1]).data("pattern");
	return (pattern == anotherPattern);
}


// psicoZ: session presentation and persistence are provided by adapter.js.
function gameover() { clearInterval(matchingGame.timer); }
function saveSavingObject() { /* No independent storage. */ }
function savedSavingObject() { return undefined; }

