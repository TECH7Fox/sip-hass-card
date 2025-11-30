import logging
from pathlib import Path
from homeassistant.core import HomeAssistant
from homeassistant.components.http import StaticPathConfig
from aiohttp.web import Request, Response
from homeassistant.components.hassio.const import DOMAIN as HASSIO_DOMAIN
from homeassistant.components.hassio.handler import HassIO, get_supervisor_client
from homeassistant.helpers.http import HomeAssistantView
from homeassistant.config_entries import ConfigEntry, ConfigError
from .const import DOMAIN, JS_FILENAME, JS_URL_PATH
from .resources import add_resources, remove_resources


logger = logging.getLogger(__name__)


async def async_setup_entry(hass: HomeAssistant, config_entry: ConfigEntry) -> bool:
    """Set up the SIP Core component."""

    logger.info("Registering SIP Core HTTP views")
    hass.http.register_view(SipCoreConfigView())
    hass.http.register_view(AsteriskIngressView())

    logger.info("Setting up SIP Core component")
    hass.data.setdefault(DOMAIN, {
        "sip_config": config_entry.data.get("sip_config", {}),
        "data": config_entry.data,
        "options": config_entry.options,
        "entry_id": config_entry.entry_id,
    })
    logger.info(config_entry.data)
    logger.info(config_entry.options)
    logger.info(config_entry.entry_id)

    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(
                url_path=JS_URL_PATH,
                path=Path(__file__).parent / "www" / JS_FILENAME,
                cache_headers=True,
            )
        ]
    )

    await add_resources(hass)
    return True


async def async_unload_entry(hass: HomeAssistant, config_entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    logger.info("Unloading SIP Core component")
    hass.data.pop(DOMAIN, None)
    await remove_resources(hass)
    return True


class SipCoreConfigView(HomeAssistantView):
    """View to serve SIP Core configuration."""

    url = "/api/sip-core/config"
    name = "api:sip-core:config"
    requires_auth = True

    async def get(self, request: Request):
        """Handle GET request."""
        hass: HomeAssistant = request.app["hass"]
        sip_core_data: dict = hass.data.get(DOMAIN, {})
        return self.json(sip_core_data.get("sip_config", {"error": "No configuration found"}))


class AsteriskIngressView(HomeAssistantView):
    """View to handle Asterisk Add-on ingress."""

    url = "/api/sip-core/asterisk-ingress"
    name = "api:sip-core:asterisk-ingress"
    requires_auth = True

    async def get(self, request: Request) -> Response:
        hass: HomeAssistant = request.app["hass"]
        hassio: HassIO | None = hass.data.get(HASSIO_DOMAIN)
        if not hassio:
            return self.json({"error": "Hass.io not available"}, status_code=503)

        supervisor_client = get_supervisor_client(hass)
        try:
            # TODO: Allow external asterisk servers with custom URL?
            addon_info = await supervisor_client.addons.addon_info("3e533915_asterisk")
            ingress_entry = addon_info.ingress_entry
            if not ingress_entry:
                raise ValueError("Ingress entry not found for Asterisk add-on")
            return self.json({"ingress_entry": ingress_entry})
        except Exception as err:
            logger.error(f"Error fetching Asterisk add-on info: {err}")
            return self.json({"error": "Failed to fetch add-on info"}, status_code=500)
