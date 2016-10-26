package org.matonto.web.security;

/*-
 * #%L
 * org.matonto.web.security
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.eclipsesource.jaxrs.provider.security.AuthenticationHandler;
import com.eclipsesource.jaxrs.provider.security.AuthorizationHandler;
import org.apache.log4j.Logger;
import org.matonto.jaas.api.config.MatontoConfiguration;
import org.matonto.jaas.api.engines.EngineManager;
import org.matonto.jaas.api.ontologies.usermanagement.Role;
import org.matonto.jaas.api.utils.TokenUtils;
import org.matonto.web.security.util.RestSecurityUtils;

import javax.security.auth.Subject;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.SecurityContext;
import java.security.Principal;
import java.util.Optional;

@Component(immediate = true)
public class RestSecurityHandler implements AuthenticationHandler, AuthorizationHandler {
    private final static String USER_CLASS = "org.matonto.jaas.api.principals.UserPrincipal";
    private static final Logger LOG = Logger.getLogger(RestSecurityHandler.class.getName());

    protected MatontoConfiguration matOntoConfiguration;
    protected EngineManager engineManager;

    @Reference
    protected void setMatOntoConfiguration(MatontoConfiguration configuration) {
        this.matOntoConfiguration = configuration;
    }

    @Reference
    protected void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Override
    public Principal authenticate(ContainerRequestContext containerRequestContext) {
        Subject subject = new Subject();
        String tokenString = TokenUtils.getTokenString(containerRequestContext);

        if (!RestSecurityUtils.authenticateToken("matonto", subject, tokenString, matOntoConfiguration)) {
            return null;
        }

        Optional<Principal> principal = subject.getPrincipals().stream()
                .filter(p -> p.getClass().getName().equals(USER_CLASS))
                .findFirst();
        return principal.get();
    }

    @Override
    public String getAuthenticationScheme() {
        return SecurityContext.BASIC_AUTH;
    }

    @Override
    public boolean isUserInRole(Principal principal, String role) {
        if (principal.getClass().getName().equals(USER_CLASS)) {
            for (Role roleObj : engineManager.getUserRoles(principal.getName())) {
                if (roleObj.getResource().stringValue().equals(role)) {
                    return true;
                }
            }
        }

        return false;
    }
}
