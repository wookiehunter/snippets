const videoEl = document.getElementById('video')
const button = document.getElementById('button')

// async func to prompt user, pass to video element and then play

async function selectMediaStream() {
    try {
        const mediaStream = await navigator.mediaDevices.getDisplayMedia()
        videoEl.srcObject = mediaStream
        videoEl.onloadedmetadata = () => {
            videoEl.play()
        }
    } catch (error) { 
        console.log(error)
    }
}

button.addEventListener('click', async () => {
    // disable button
    button.disabled = true

    // start PIP
    await videoEl.requestPictureInPicture()
    button.disabled = false
})

// on load
selectMediaStream()