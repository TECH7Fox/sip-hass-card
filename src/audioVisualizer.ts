export class AudioVisualizer {
    shouldStop: boolean;
    audioContext: AudioContext;
    analyser: any;
    renderRoot: any;
    visualValueCount: number;
    visualMainElement: any;
    visualElements: any;

    constructor(renderRoot: any, stream: MediaStream, visualValueCount: number) {
        this.shouldStop = false;
        this.renderRoot = renderRoot;
        this.visualValueCount = visualValueCount;
        this.visualMainElement = this.renderRoot.querySelector('#audioVisualizer');
        this.audioContext = new AudioContext();
        this.initDOM();
        this.connectStream(stream);
    }

    public stop() {
        this.shouldStop = true;
    }

    initDOM() {
        this.visualMainElement!.innerHTML = '';
        let i;
        for ( i = 0; i < this.visualValueCount; ++i ) {
            const elm = document.createElement( 'div' );
            this.visualMainElement!.appendChild( elm );
        }

        this.visualElements = this.renderRoot.querySelectorAll('#audioVisualizer div');
    };

    processFrame(data: any) {
        const dataMap: any = { 0: 15, 1: 10, 2: 8, 3: 9, 4: 6, 5: 5, 6: 2, 7: 1, 8: 0, 9: 4, 10: 3, 11: 7, 12: 11, 13: 12, 14: 13, 15: 14 };
        const values: any = Object.values( data );
        let i;
        for ( i = 0; i < this.visualValueCount; ++i ) {
            const value = (values[ dataMap[ i ] ] / 255);// + 0.025;
            const elmStyles = this.visualElements[ i ].style;
            elmStyles.transform = `scaleY( ${ value } )`;
            elmStyles.opacity = Math.max( .25, value );
        }
    };
  
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
        const renderFrame = () => {
            this.analyser.getByteFrequencyData(frequencyData);
            this.processFrame(frequencyData);
            
            if (this.shouldStop !== true) {
                requestAnimationFrame(renderFrame);
            }
        };
        requestAnimationFrame(renderFrame);
    }
}