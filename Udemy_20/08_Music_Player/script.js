const music = document.querySelector('audio')
const prevBtn = document.getElementById('prev')
const playBtn = document.getElementById('play')
const nextBtn = document.getElementById('next')
const image = document.querySelector('img')
const title = document.getElementById('title')
const artist = document.getElementById('artist')
const progressContainer = document.getElementById('progress-container')
const progress = document.getElementById('progress')
const currenTimeEl = document.getElementById('current-time')
const durationEl = document.getElementById('duration')

//Music
const songs = [
    {
        name: 'jacinto-1',
        displayName: 'Electric Chill Machine',
        artist: 'Jacinto Design',
    },
    {
        name: 'jacinto-2',
        displayName: 'Seven Nation Army (Remix)',
        artist: 'Jacinto Design',
    },
    {
        name: 'jacinto-3',
        displayName: 'Some shit',
        artist: 'Jacinto Design',
    },
    {
        name: 'metric-1',
        displayName: 'sOME MORE SHIT',
        artist: 'Jacinto Design',
    }
]

//  check if playing
let ifPlaying = false

// play
function playSong() {
    music.play()
    ifPlaying = true
    playBtn.classList.replace('fa-play', 'fa-pause')
    playBtn.setAttribute('title', 'Pause')
}
// pause
function pauseSong() {
    music.pause()
    ifPlaying = false
    playBtn.classList.replace('fa-pause', 'fa-play')
    playBtn.setAttribute('title', 'Play')
}

playBtn.addEventListener('click', () => (ifPlaying ? pauseSong() : playSong()))

// update DOM
function loadSong(song) {
    title.textContent = song.displayName
    artist.textContent = song.artist
    music.src = `music/${song.name}.mp3`
    image.src = `img/${song.name}.jpg`
}

// current song
let songIndex = 0

// next function
function nextSong() {
    songIndex++
    if(songIndex > songs.length - 1) {
        songIndex = 0
    }
    loadSong(songs[songIndex])
    playSong()
}

// prev function
function prevSong() {
    songIndex--
    if(songIndex < 0) {
        songIndex = songs.length -1
    }
    loadSong(songs[songIndex])
    playSong()
}

// on load
loadSong(songs[songIndex])

// update progress bar and time
function updateProgressBar(e) {
    if(ifPlaying) {
        const { duration, currentTime } = e.srcElement
        // update prog bar
        const progressPercent = currentTime / duration * 100
        progress.style.width = `${progressPercent}%`
        // calc display duration
        const durationMinutes = Math.floor(duration / 60)
        let durationSeconds = Math.floor(duration % 60)
        if(durationSeconds < 10) {
            durationSeconds = `0${durationSeconds}`
        }
        //delay switching duration element to avoid NaN
        if(durationSeconds) {
            durationEl.textContent = `${durationMinutes}:${durationSeconds}`
        }
        // calc display currenttime
        const currentMinutes = Math.floor(currentTime / 60)
        let currentSeconds = Math.floor(currentTime % 60)
        if(currentSeconds < 10) {
            currentSeconds = `0${currentSeconds}`
        }
        currenTimeEl.textContent = `${currentMinutes}:${currentSeconds}`
    }
}

// set prog bar
function setProgressBar(e) {
    const width = this.clientWidth
    let clickX = e.offsetX

    const { duration } = music

    music.currentTime = (clickX / width * duration)
}

// event listeners
prevBtn.addEventListener('click', prevSong)
nextBtn.addEventListener('click', nextSong)
music.addEventListener('timeupdate', updateProgressBar)
progressContainer.addEventListener('click', setProgressBar)
music.addEventListener('ended', nextSong)