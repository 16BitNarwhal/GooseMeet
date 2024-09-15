import { MrGoose } from "./goose";

let currentAudio = null;
let currentAnalyser = null;
let currentInterval = null;

export const PlayGooseAudio = (audioUri, animationCallback, volumeThreshold = 8) => {
    if (currentAudio) {
        // currentAudio.pause();
        // currentAudio.currentTime = 0;
        // clearInterval(currentInterval);
        return;
    }

    const audio = new Audio(audioUri);
    currentAudio = audio;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    currentAnalyser = analyser;

    const source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    analyser.fftSize = 512;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        const volume = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
        console.debug(`Current volume: ${volume}`);
        
        if (volume > volumeThreshold) {
            animationCallback(MrGoose.Anims.SPEAK_START);
        } else {
            animationCallback(MrGoose.Anims.SPEAK_STOP);
        }
    };

    audio.onplay = () => {
        audioContext.resume();
        currentInterval = setInterval(checkVolume, 100);
    };

    audio.onended = () => {
        clearInterval(currentInterval);
        animationCallback(MrGoose.Anims.SPEAK_STOP);
        animationCallback(MrGoose.Anims.IDLE);
    };

    audio.play().catch(error => console.error("Error playing audio:", error));
};