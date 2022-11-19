const quoteContainer = document.getElementById('quote-container')
const quoteText = document.getElementById('quote')
const authorText = document.getElementById('author')
const twitterBtn = document.getElementById('twitter')
const newQuoteBtn = document.getElementById('new-quote')
const loader = document.getElementById('loader')

// show loader

function loading() {
    loader.hidden = false
    quoteContainer.hidden = true
}

// hide loading

function complete() {
    if(!loader.hidden) {
        quoteContainer.hidden = false
        loader.hidden = true
    }
}

// Get quote from API
async function getQuote() {
    loading();
    const proxyURL = 'https://jacinto-cors-proxy.herokuapp.com/'
    const apiURL = 'http://api.forismatic.com/api/1.0/?method=getQuote&lang=en&format=json';

    try {
        const response = await fetch(proxyURL + apiURL);
        const data = await response.json();

        // if author is blank add 'Unknown'
        if(data.quoteAuthor === '') {
            authorText.innerText = 'Unknown'
        } else {
            authorText.innerText = data.quoteAuthor;
        }

        // reduce fontsize for long quotes
        if(data.quoteText > 120) {
            quoteText.classList.add('long-quote')
        } else {
            quoteText.classList.remove('long-quote')
        }

        quoteText.innerText = data.quoteText;

        // Stop loader, show quote
        complete()
    } catch (error) {
        getQuote()
    }
}

function tweetQuote() {
    const quote = quoteText.innerText
    const author = authorText.innerText
    const twitterURL = `https://twitter.com/intent/tweet?text=${quote} - ${author}`
    window.open(twitterURL, '_blank')
}

// event listenters

newQuoteBtn.addEventListener('click', getQuote);

twitterBtn.addEventListener('click', tweetQuote);

// On Load
getQuote()