import { MrGoose } from "./goose";

export const PlayGooseAudio = (audioUri, animationCallback, volumeThreshold = 8) => {
    const audio = new Audio(audioUri);
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaElementSource(audio);

    // Connect sources
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    analyser.fftSize = 512;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const CheckVolume = () => {
        // Average frequency intensities to calculate approximate volume
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
        const intervalId = setInterval(CheckVolume, 100);

        audio.onended = () => {
            clearInterval(intervalId);
            animationCallback(MrGoose.Anims.SPEAK_STOP);
            animationCallback(MrGoose.Anims.IDLE);
        };
    };

    audio.play();
};
