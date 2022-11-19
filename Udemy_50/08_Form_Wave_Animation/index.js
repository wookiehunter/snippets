const label = document.querySelectorAll('.form-control label')

label.forEach(label => {
    label.innerHTML = label.innerText
    .split('') // breaks into an array
    .map((letter, idx) => `<span style="transition-delay:${idx * 50}ms">${letter}</span>`) // maps the array with a span around each letter with the transition delay that gives the wave effect
    .join('') // brings it back together as a string
})