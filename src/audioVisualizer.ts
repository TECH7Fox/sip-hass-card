// @ts-nocheck

export class AudioVisualizer {
    constructor( audioContext, processFrame, processError ) {
      this.audioContext = audioContext;
      this.processFrame = processFrame;
      this.connectStream = this.connectStream.bind( this );
      navigator.mediaDevices.getUserMedia( { audio: true, video: false } )
        .then( this.connectStream )
        .catch( ( error ) => {
          if ( processError ) {
            processError( error );
          }
        } );
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
        console.log(frequencyData);

        requestAnimationFrame( renderFrame );
      };
      requestAnimationFrame( renderFrame );
    }
}