export class AudioVisualizer {
    shouldStop: boolean;
    audioContext: any;
    processFrame: any;
    analyser: any;

    constructor(audioContext: AudioContext, processFrame: (data: any) => void, stream: any) {
        this.shouldStop = false;
        this.audioContext = audioContext;
        this.processFrame = processFrame;
        this.connectStream = this.connectStream.bind( this );
        this.connectStream(stream);
    }

    public stop() {
        this.shouldStop = true;
    }
  
    connectStream(stream: any) {
        this.analyser = this.audioContext.createAnalyser();
        const source = this.audioContext.createMediaStreamSource(stream);
        source.connect(this.analyser);
        this.analyser.smoothingTimeConstant = 0.5;
        this.analyser.fftSize = 32;
  
        this.initRenderLoop();
    }
  
    initRenderLoop() {
        const frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
        const processFrame = this.processFrame || ( () => {} );
    
        const renderFrame = () => {
            this.analyser.getByteFrequencyData(frequencyData);
            processFrame(frequencyData);
            
            if (this.shouldStop !== true) {
                requestAnimationFrame(renderFrame);
            }
        };
        requestAnimationFrame(renderFrame);
    }
}