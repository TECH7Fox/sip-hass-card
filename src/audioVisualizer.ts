// @ts-nocheck

export class AudioVisualizer {

    constructor( audioContext, processFrame, stream ) {
        this.shouldStop = false;
        this.audioContext = audioContext;
        this.processFrame = processFrame;
        this.connectStream = this.connectStream.bind( this );
        this.connectStream(stream);
        //   navigator.mediaDevices.getUserMedia( { audio: true, video: false } )
        //     .then( this.connectStream )
        //     .catch( ( error ) => {
        //       if ( processError ) {
        //         processError( error );
        //       }
        //     } );
    }

    public stop() {
        this.shouldStop = true;
    }
  
    connectStream( stream ) {
        this.analyser = this.audioContext.createAnalyser();
        const source = this.audioContext.createMediaStreamSource( stream );
        source.connect( this.analyser );
        this.analyser.smoothingTimeConstant = 0.5;
        this.analyser.fftSize = 32;
  
        this.initRenderLoop( this.analyser );
    }
  
    initRenderLoop() {
        const frequencyData = new Uint8Array( this.analyser.frequencyBinCount );
        const processFrame = this.processFrame || ( () => {} );
    
        const renderFrame = () => {
            this.analyser.getByteFrequencyData( frequencyData );
            processFrame( frequencyData );
            
            if (this.shouldStop !== true) {
                requestAnimationFrame( renderFrame );
            }
        };
        requestAnimationFrame( renderFrame );
    }
}