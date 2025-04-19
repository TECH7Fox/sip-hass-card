class AudioVisualizer {
    shouldStop;
    audioContext;
    analyser;
    renderRoot;
    visualValueCount;
    visualMainElement;
    visualElements;

    constructor(renderRoot, stream, visualValueCount = 16) {
        this.shouldStop = false;
        this.renderRoot = renderRoot;
        this.visualValueCount = visualValueCount;
        this.visualMainElement = this.renderRoot.querySelector('#audioVisualizer');
        this.audioContext = new AudioContext();
        this.initDOM();
        this.connectStream(stream);
    }

    stop() {
        this.shouldStop = true;
    }

    initDOM() {
        if (this.visualMainElement) {
            this.visualMainElement.innerHTML = '';
            let i;
            for ( i = 0; i < this.visualValueCount; ++i ) {
                const elm = document.createElement( 'div' );
                this.visualMainElement.appendChild( elm );
            }

            this.visualElements = this.renderRoot.querySelectorAll('#audioVisualizer div');
        }
    };

    processFrame(data) {
        const dataMap = { 0: 15, 1: 10, 2: 8, 3: 9, 4: 6, 5: 5, 6: 2, 7: 1, 8: 0, 9: 4, 10: 3, 11: 7, 12: 11, 13: 12, 14: 13, 15: 14 };
        const values = Object.values( data );
        let i;
        for ( i = 0; i < this.visualValueCount; ++i ) {
            const value = (values[ dataMap[ i ] ] / 255);// + 0.025;
            const elmStyles = this.visualElements[ i ].style;
            elmStyles.transform = `scaleY( ${ value } )`;
            elmStyles.opacity = Math.max( .25, value );
        }
    };

    connectStream(stream) {
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

export { AudioVisualizer };
