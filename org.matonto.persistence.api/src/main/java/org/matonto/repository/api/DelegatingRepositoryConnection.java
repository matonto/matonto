package org.matonto.repository.api;

/*-
 * #%L
 * org.matonto.persistence.api
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

public interface DelegatingRepositoryConnection extends RepositoryConnection {

    /**
     * Gets the RepositoryConnection wrapped by this DelegatingRepositoryConnection.
     *
     * @return the RepositoryConnection wrapped by this DelegatingRepositoryConnection.
     */
    RepositoryConnection getDelegate();

    /**
     * Sets the RepositoryConnection wrapped by this DelegatingRepositoryConnection.
     *
     * @param delegate - The RepositoryConnection to be wrapped by this DelegatingRepositoryConnection.
     */
    void setDelegate(RepositoryConnection delegate);
}
