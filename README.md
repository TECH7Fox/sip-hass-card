![<img src="/images/dark_logo.png" width="200"/>](/images/dark_logo.png)

SIP Core, part of the SIP-HASS project, is the system that powers Home Assistant cards to make and receive SIP calls using WebRTC.
It includes official cards and popups, but also supports third-party cards.

[![Discord](https://img.shields.io/badge/Discord-%235865F2.svg?style=for-the-badge&logo=discord&logoColor=white)](https://discordapp.com/invite/qxnDtHbwuD)
[![SIP-HASS Docs](https://img.shields.io/badge/SIP_HASS_Docs-%233ECC5F.svg?style=for-the-badge&logo=bookstack&logoColor=white)](https://tech7fox.github.io/sip-hass-docs/)
[![SIP-HASS Docs](https://img.shields.io/badge/HACS_Repository-%2341BDF5.svg?style=for-the-badge&logo=homeassistant&logoColor=white)](https://my.home-assistant.io/redirect/hacs_repository/?owner=TECH7Fox&repository=sip-hass-card&category=integration)

## Features

  * Make and receive calls
  * Ringtones
  * Video calls
  * DTMF support
  * Popups for incoming calls
  * Auto call on load (using `?call=<number>` in the URL)
  * Custom icons and names per contact
  * Ingress for easy setup
  * Audio device selection
  * API for third-party developers to build custom cards and popups

## Default Popup

<p float="left">
  <img height="380" hspace="15" alt="popup" src="https://github.com/user-attachments/assets/2fd96401-1004-40f8-9531-737b6d57dbad" />
  <img height="380" hspace="15" alt="popup_config" src="https://github.com/user-attachments/assets/695eb05a-038a-4b7a-8afb-cda022499ca3" />
</p>

- Automatically opens on incoming calls
- Audio Visualizer
- Menu to configure audio devices
  - And shows debug information
- Custom buttons
- Mute mic & camera buttons

## Call Card

<img align="left" height="200" hspace="60" alt="call_card" src="https://github.com/user-attachments/assets/5607c68c-1fa2-4635-aae9-3ca0be7684a1" />

`custom:sip-call-card`
 
- Audio Visualizer
- Supports camera entities for video
- Custom buttons for quick actions
- Mute mic & camera buttons

<br>
<br>
<br clear="left"/>

## Contacts Card

<img align="right" height="250" hspace="60" alt="contacts_card" src="https://github.com/user-attachments/assets/97ee6e02-f9b4-45d7-b033-60185ab4334c" />

`custom:sip-contacts-card`

- Start calls to users/numbers
- Option to hide your own user
- Custom names & icons
- Open field option
- State color with status entity

<br>

## Requirements
For this to work you will need the following:
 * A sip/pbx server (Works best with the [Asterisk add-on](https://github.com/TECH7Fox/Asterisk-add-on))
 * HTTPS for Home Assistant
 * HACS for easy installation


## Wiki

You can find the installation instructions and guides on the documentation site: <kbd>[SIP-HASS Docs](https://tech7fox.github.io/sip-hass-docs/)</kbd>

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=TECH7Fox/sip-hass-card,TECH7Fox/asterisk-hass-addons,TECH7Fox/asterisk-hass-integration&type=date&legend=top-left)](https://www.star-history.com/#TECH7Fox/sip-hass-card&TECH7Fox/asterisk-hass-addons&TECH7Fox/asterisk-hass-integration&type=date&legend=top-left)

## Contact
**jordy.kuhne@gmail.com**
