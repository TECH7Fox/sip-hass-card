import logging
import voluptuous as vol
from typing import Any

from homeassistant import config_entries
from homeassistant.core import callback
from homeassistant.data_entry_flow import FlowResult
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.selector import TemplateSelector, ObjectSelector
from .const import DOMAIN
from .defaults import sip_config

logger: logging.Logger = logging.getLogger(__name__)


class SipCoreConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for SIP Core."""

    VERSION = 1

    async def async_step_user(self, user_input = None):
        if user_input is not None:
            await self.async_set_unique_id(DOMAIN)
            self._abort_if_unique_id_configured()
            return self.async_create_entry(title="SIP Core", data=user_input)

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema({
                vol.Required(
                    "sip_config",
                    description={
                        "suggested_value": sip_config,
                    }
                ): ObjectSelector(),
            })
        )
