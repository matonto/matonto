import preferenceGroupComponent from "../../settings/components/preferenceGroup/preferenceGroup.component";

/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
preferenceManagerService.$inject = ['$http', '$q', 'REST_PREFIX', 'utilService', 'prefixes', 'httpService'];

/**
 * @ngdoc service
 * @name shared.service:preferenceManagerService
 * @requires $http
 * @requires $q
 * @requires shared.service:utilService
 * @requires shared.service:prefixes
 * @requires shared.service:httpService
 *
 * @description
 * `preferenceManagerService` is a service that provides access to the Mobi Preference REST endpoints and variables
 * to hold information about the different types of preferences.
 */
function preferenceManagerService($http, $q, REST_PREFIX, utilService, prefixes, httpService) {
    var self = this,
        util = utilService,
        prefix = REST_PREFIX + 'preference';

    /**
     * @ngdoc property
     * @name activityTypes
     * @propertyOf shared.service:preferenceManagerService
     * @type {Object[]}
     *
     * @description
     * `activityTypes` is an array of objects that represent the different subclasses of `prov:Activity`
     * that Mobi supports ordered such that subclasses are first. Each object contains the type IRI, the
     * associated active word, and associated predicate for linking to the affected `prov:Entity(s)`.
     */
    self.activityTypes = [
        {
            type: prefixes.matprov + 'CreateActivity',
            word: 'created',
            pred: prefixes.prov + 'generated'
        },
        {
            type: prefixes.matprov + 'UpdateActivity',
            word: 'updated',
            pred: prefixes.prov + 'used'
        },
        {
            type: prefixes.matprov + 'UseActivity',
            word: 'used',
            pred: prefixes.prov + 'used'
        },
        {
            type: prefixes.matprov + 'DeleteActivity',
            word: 'deleted',
            pred: prefixes.prov + 'invalidated'
        }
    ];

    /**
     * @ngdoc method
     * @name getUserPreferences
     * @methodOf shared.service:provManagerService
     *
     * @description
     * Makes a call to GET /mobirest/provenance-data to get a paginated list of `Activities` and their associated
     * `Entities`. Returns the paginated response for the query using the passed page index and limit. The
     * data of the response will be an object with the array of `Activities` and the array of associated
     * `Entities`, the "x-total-count" headers will contain the total number of `Activities` matching the
     * query, and the "link" header will contain the URLs for the next and previous page if present. Can
     * optionally be a cancel-able request by passing a request id.
     *
     * @param {Object} paginatedConfig A configuration object for paginated requests
     * @param {number} paginatedConfig.limit The number of results per page
     * @param {number} paginatedConfig.pageIndex The index of the page of results to retrieve
     * @param {string} [id=''] The identifier for this request
     * @return {Promise} A promise that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    self.getUserPreferences = function(id = '') {
        const promise = id ? httpService.get(prefix, id) : $http.get(prefix);
        return promise.then($q.when, util.rejectError);
    };


    // return $http.put(prefix + encodeURIComponent(recordId) + '/instances/' + encodeURIComponent(instanceId), angular.toJson(json))
    //         .then(response => $q.when(), util.rejectError);
    self.updateUserPreference = function(preferenceId, preferenceType, userPreference, id = '') {
        const config = { params: { preferenceType } };
        const promise = id ? httpService.put(prefix + '/' + encodeURIComponent(preferenceId), userPreference, config, id) 
            : $http.put(prefix + '/' + encodeURIComponent(preferenceId), userPreference, config);
        return promise.then($q.when, util.rejectError);
    }

    self.getPreferenceGroups = function(id = '') {
        const promise = id ? httpService.get(prefix + '/groups', id) : $http.get(prefix + '/groups');
        return promise.then($q.when, util.rejectError);
    };

    self.getPreferenceDefinitions = function(preferenceGroup, id = '') {
        const promise = id ? httpService.get(prefix + '/groups/' + encodeURIComponent(preferenceGroup) + '/definitions', id) 
            : $http.get(prefix + '/groups/' + encodeURIComponent(preferenceGroup) + '/definitions');
        return promise.then($q.when, util.rejectError);
    }
}

export default preferenceManagerService;