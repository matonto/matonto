package org.matonto.platform.config.impl.server;

/*-
 * #%L
 * org.matonto.platform.config.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */


import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import aQute.configurable.Configurable;
import org.matonto.exception.MatOntoException;
import org.matonto.platform.config.api.server.MatOnto;
import org.matonto.platform.config.api.server.MatOntoConfig;
import org.osgi.service.cm.Configuration;
import org.osgi.service.cm.ConfigurationAdmin;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.net.UnknownHostException;
import java.util.Hashtable;
import java.util.Map;
import java.util.UUID;

@Component(immediate = true, name = MatOntoImpl.SERVICE_NAME)
public class MatOntoImpl implements MatOnto {

    public static final String SERVICE_NAME = "org.matonto.platform.server";

    private static final Logger LOGGER = LoggerFactory.getLogger(MatOntoImpl.class);

    private ConfigurationAdmin configurationAdmin;

    private UUID serverId;

    @Activate
    public void activate(final Map<String, Object> configuration) {
        final MatOntoConfig serviceConfig = Configurable.createConfigurable(MatOntoConfig.class, configuration);
        if (serviceConfig.serverId() == null) {
            final byte[] macId = getMacId();
            this.serverId = UUID.nameUUIDFromBytes(macId);
            configuration.put("serverId", this.serverId.toString());
            updateServiceConfig(configuration);
        } else {
            final String id = serviceConfig.serverId();
            try {
                this.serverId = UUID.fromString(id);
            } catch (IllegalArgumentException e) {
                // If the currently configured server id is invalid (a non-UUID).
                throw new MatOntoException("Previously configured server ID is invalid: " + id, e);
            }
        }
        LOGGER.info("Initialized core platform server service with id {}", this.serverId);
    }

    /**
     * Inject the {@link ConfigurationAdmin} into our service.
     */
    @Reference
    public void setConfigurationAdmin(ConfigurationAdmin admin) {
        this.configurationAdmin = admin;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public UUID getServerIdentifier() {
        return this.serverId;
    }

    /**
     * Save an updated service configuration.
     *
     * @param configuration The modified map of configuration to persist
     */
    private void updateServiceConfig(final Map<String, Object> configuration) {
        try {
            final Configuration config = this.configurationAdmin.getConfiguration(SERVICE_NAME);
            config.update(new Hashtable<>(configuration));
        } catch (IOException e) {
            LOGGER.error("Issue saving server id to service configuration: " + SERVICE_NAME, e);
            // Continue along, since we'll just re-generate the service configuration next time the server starts.
        }
    }

    /**
     * @return The MAC id of the current server
     * @throws MatOntoException If there is an issue fetching the MAC id
     */
    private static byte[] getMacId() throws MatOntoException {
        try {
            final InetAddress address = InetAddress.getLocalHost();
            final NetworkInterface nwi = NetworkInterface.getByInetAddress(address);
            return nwi.getHardwareAddress();
        } catch (UnknownHostException | SocketException e) {
            // Failure to retrieve the mac id will cause generation issues for the server id.
            throw new MatOntoException("Issue determining MAC ID of server to generate our unique server ID", e);
        }
    }
}
