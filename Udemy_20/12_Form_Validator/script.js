const form = document.getElementById('form')
const password1El = document.getElementById('password1')
const password2El = document.getElementById('password2')
const messageContainer = document.querySelector('.message-container')
const message = document.getElementById('message')

let isValid = false
let passwordsMatch = false

function validateForm() {
    // Constraint API
    isValid = form.checkValidity()
    // Styling
    if(!isValid) {
        message.textContent = 'Please fill out all fields.'
        message.style.color = 'red'
        messageContainer.style.borderColor = 'red'
        return
    }
    // password validation
    if(password1El.value === password2El.value) {
        passwordsMatch = true
        messageContainer.style.borderColor = 'Green'
        password1El.style.borderColor = 'green'
        password2El.style.borderColor = 'green'
    } else {
        passwordsMatch = false
        message.innerText = 'Your passwords do not match!'
        message.style.color = 'Red'
        messageContainer.style.borderColor = 'red'
        password1El.style.borderColor = 'red'
        password2El.style.borderColor = 'red'
        return
    }
    // form and passwords good
    if(isValid && passwordsMatch) {
        message.innerText = 'Your form has been submitted!'
        message.style.color = 'Green'
        messageContainer.style.borderColor = 'Green'
    }
}

function storeFormData() {
    const user = {
        name: form.name.value,
        phone: form.phone.value,
        email: form.email.value,
        website: form.website.value,
        password: form.password.value
    }
    // do something with data
    console.log(user)
}

function processFormData(e) {
    e.preventDefault()
    validateForm()
    if(isValid && passwordsMatch) {
        storeFormData()
    }
}

form.addEventListener('submit', processFormData)