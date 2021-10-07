/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */
import { SimpleUser, SimpleUserDelegate, SimpleUserOptions } from "../src/platform/web";
import { getAudio, getButton, getButtons, getInput, getSpan } from "./demo-utils";

const callButton = getButton("call");
const hangupButton = getButton("hangup");

// Helper function to get an HTML audio element
function getAudioElement(id: string): HTMLAudioElement {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLAudioElement)) {
    throw new Error(`Element "${id}" not found or not an audio element.`);
  }
  return el;
}

// Helper function to wait
async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// Main function
async function main(): Promise<void> {

  // SIP over WebSocket Server URL
  // The URL of a SIP over WebSocket server which will complete the call.
  // FreeSwitch is an example of a server which supports SIP over WebSocket.
  // SIP over WebSocket is an internet standard the details of which are
  // outside the scope of this documentation, but there are many resources
  // available. See: https://tools.ietf.org/html/rfc7118 for the specification.
  const server = "ws://192.168.178.11:8088/ws";

  // SIP Request URI
  // The SIP Request URI of the destination. It's "Who you wanna call?"
  // SIP is an internet standard the details of which are outside the
  // scope of this documentation, but there are many resources available.
  // See: https://tools.ietf.org/html/rfc3261 for the specification.
  const destination = "sip:101@192.168.178.11";

  // SIP Address of Record (AOR)
  // This is the user's SIP address. It's "Where people can reach you."
  // SIP is an internet standard the details of which are outside the
  // scope of this documentation, but there are many resources available.
  // See: https://tools.ietf.org/html/rfc3261 for the specification.
  const aor = "sip:103@192.168.178.11";

  // SIP Authorization Username
  // This is the user's authorization username used for authorizing requests.
  // SIP is an internet standard the details of which are outside the
  // scope of this documentation, but there are many resources available.
  // See: https://tools.ietf.org/html/rfc3261 for the specification.
  const authorizationUsername = '103';

  // SIP Authorization Password
  // This is the user's authorization password used for authorizing requests.
  // SIP is an internet standard the details of which are outside the
  // scope of this documentation, but there are many resources available.
  // See: https://tools.ietf.org/html/rfc3261 for the specification.
  const authorizationPassword = '12341234abcd';

  // Configuration Options
  // These are configuration options for the `SimpleUser` instance.
  // Here we are setting the HTML audio element we want to use to
  // play the audio received from the remote end of the call.
  // An audio element is needed to play the audio received from the
  // remote end of the call. Once the call is established, a `MediaStream`
  // is attached to the provided audio element's `src` attribute.
  const options: SimpleUserOptions = {
    aor,
    media: {
      remote: {
        audio: getAudioElement("remoteAudio")
      }
    },
    userAgentOptions: {
      authorizationPassword,
      authorizationUsername,
    }
  };

  // Construct a SimpleUser instance
  const simpleUser = new SimpleUser(server, options);

  // Supply delegate to handle inbound calls (optional)
  simpleUser.delegate = {
    onCallReceived: async () => {
      await simpleUser.answer();
    }
  };

  // Connect to server
  await simpleUser.connect();

  // Register to receive inbound calls (optional)
  await simpleUser.register();

  callButton.addEventListener("click", function() {
    simpleUser.call(destination);
  }, false);

  hangupButton.addEventListener("click", function() {
    simpleUser.hangup();
  }, false);

}

// Run it
main()
  .then(() => console.log(`Success`))
  .catch((error: Error) => console.error(`Failure`, error));