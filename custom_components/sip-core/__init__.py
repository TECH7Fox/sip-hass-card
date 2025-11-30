import logging
from pathlib import Path
from homeassistant.core import HomeAssistant
from homeassistant.components.http import StaticPathConfig
from homeassistant.components.lovelace.resources import (
    ResourceStorageCollection,
    ResourceYAMLCollection,
)
from aiohttp.web import Request, Response
from homeassistant.const import CONF_ID, CONF_URL
from homeassistant.components.hassio.const import DOMAIN as HASSIO_DOMAIN
from homeassistant.components.hassio.handler import HassIO, get_supervisor_client
from homeassistant.components.lovelace
from homeassistant.helpers.http import HomeAssistantView
from homeassistant.config_entries import ConfigEntry, ConfigError
from homeassistant.components.lovelace.const import (
    CONF_RESOURCE_TYPE_WS,
    DOMAIN as LL_DOMAIN,
)
from .const import DOMAIN, JS_FILENAME, JS_URL_PATH

logger = logging.getLogger(__name__)

async def async_setup(hass: HomeAssistant, config_entry: ConfigEntry) -> bool:
    """Set up the SIP Core component."""

    logger.info("Registering SIP Core HTTP views")
    hass.http.register_view(SipCoreConfigView())
    hass.http.register_view(AsteriskIngressView())

    logger.info("Setting up SIP Core component")
    hass.data.setdefault(DOMAIN, {
        "data": config_entry.data,
        "options": config_entry.options,
        "entry_id": config_entry.entry_id,
    })

    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(
                url_path=JS_URL_PATH,
                path=Path(__file__).parent / "www" / JS_FILENAME,
                cache_headers=True,
            )
        ]
    )

    resources: ResourceStorageCollection | ResourceYAMLCollection | None = None
    if lovelace_data := hass.data.get(LL_DOMAIN):
        resources = lovelace_data.resources
    if resources:
        if not resources.loaded:
            await resources.async_load()
            logger.debug("Manually loaded resources")
            resources.loaded = True

        res_id = next(
            (
                data[CONF_ID]
                for data in resources.async_items()
                if data[CONF_URL] == JS_URL_PATH
            ),
            None,
        )

        if res_id is None:
            logger.info("Registering SIP Core module in Lovelace resources")
            if isinstance(resources, ResourceYAMLCollection):
                logger.warning("SIP Core module not registered because resources are managed via YAML")
                return False # TODO: Return error for user?
            else:
                data = await resources.async_create_item(
                    {CONF_RESOURCE_TYPE_WS: "module", CONF_URL: JS_URL_PATH}
                )
                logger.debug(f"Registered SIP Core module with resource ID {data[CONF_ID]}")
        else:
            logger.debug(f"module already registered with resource ID {res_id}")
    
    return True


class SipCoreConfigView(HomeAssistantView):
    """View to serve SIP Core configuration."""

    url = "/api/sip-core/config"
    name = "api:sip-core:config"
    requires_auth = True

    async def get(self, request: Request):
        """Handle GET request."""
        hass: HomeAssistant = request.app["hass"]
        sip_core_data = hass.data.get(DOMAIN, {})
        return self.json(sip_core_data)


class AsteriskIngressView(HomeAssistantView):
    """View to handle Asterisk Add-on ingress."""

    url = "/api/sip-core/asterisk-ingress"
    name = "api:sip-core:asterisk-ingress"
    requires_auth = True

    async def get(self, request: Request) -> Response:
        """Handle GET request."""
        hass: HomeAssistant = request.app["hass"]
        hassio: HassIO | None = hass.data.get(HASSIO_DOMAIN)
        if not hassio:
            return self.json({"error": "Hass.io not available"}, status_code=503)

        supervisor_client = get_supervisor_client(hass)
        try:
            # TODO: Allow external asterisk servers with custom URL?
            addon_info = await supervisor_client.addons.addon_info("3e533915-asterisk")
            ingress_url = addon_info.ingress_entry
            if not ingress_url:
                raise ValueError("Ingress URL not found for Asterisk add-on")
            return self.json({"ingress_url": ingress_url})
        except Exception as err:
            logger.error(f"Error fetching Asterisk add-on info: {err}")
            return self.json({"error": "Failed to fetch add-on info"}, status_code=500)
