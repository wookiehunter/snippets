const calculatorDisplay = document.querySelector('h1');
const inputBtns = document.querySelectorAll('button');
const clearBtn = document.getElementById('clear-btn');

let firstValue = 0
let operatorValue = ''
let awaitingNextvalue = false

function sendNumberValue(number) {
    if(awaitingNextvalue) {
        calculatorDisplay.textContent = number
        awaitingNextvalue = false
    } else {
        const displayValue = calculatorDisplay.textContent
        calculatorDisplay.textContent = displayValue === '0' ? number : displayValue + number
    }
}

function addDecimal() {
    if(awaitingNextvalue) return

    if(!calculatorDisplay.textContent.includes('.')) {
        calculatorDisplay.textContent = `${calculatorDisplay.textContent}.`;
    }
}

// calculate first and second values
const calculate = {
    '/': (firstNumber, secondNumber) => firstNumber / secondNumber,
    '*': (firstNumber, secondNumber) => firstNumber * secondNumber,
    '+': (firstNumber, secondNumber) => firstNumber + secondNumber,
    '-': (firstNumber, secondNumber) => firstNumber - secondNumber,
    '=': (firstNumber, secondNumber) => secondNumber,
}

function useOperator(operator) {
    const currentValue = Number(calculatorDisplay.textContent)
    // prevent multiple
    if(operatorValue && awaitingNextvalue) {
        operatorValue = operator
        return

    }

    if(!firstValue) {
        firstValue = currentValue
    } else {
        const calculation = calculate[operatorValue](firstValue, currentValue)
        calculatorDisplay.textContent = calculation
        firstValue = calculation
    }

    awaitingNextvalue = true
    operatorValue = operator;
}

// event listeners
inputBtns.forEach((inputBtn) => {
    if(inputBtn.classList.length === 0) {
        inputBtn.addEventListener('click', () => sendNumberValue(inputBtn.value))
    } else if(inputBtn.classList.contains('operator')) {
        inputBtn.addEventListener('click', () => useOperator(inputBtn.value))
    } else if(inputBtn.classList.contains('decimal')) {
        inputBtn.addEventListener('click', () => addDecimal())
    }
})

// reset display
function resetAll() {
    calculatorDisplay.textContent = '0'
    firstValue = 0
    operatorValue = ''
    awaitingNextvalue = false
}

clearBtn.addEventListener('click', resetAll)